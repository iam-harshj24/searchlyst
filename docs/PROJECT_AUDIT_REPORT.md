# Searchlyst — Detailed Project Audit Report

**Document type:** Production-readiness and technical risk assessment  
**Scope:** Full-stack codebase (React/Vite frontend, Express/Prisma backend)  
**Methodology:** Static analysis, dependency review, architecture walkthrough, security pattern review  
**Audience:** Engineering leadership, security review, and implementation owners  

---

## 1. Executive summary

### 1.1 Overall assessment

| Dimension | Score (1–10) | Summary |
|-----------|--------------|---------|
| Security | **2** | No rate limiting or standard security headers; credential and JWT risks; authorization gaps on some resources |
| Performance | **3** | Large JS bundle; heavy DB reads for scans; limited caching; CPU-heavy scoring paths |
| Reliability | **4** | Silent error swallowing; shallow health check; minimal graceful shutdown |
| Maintainability | **5** | Clear feature areas but very large files and duplicated logic |
| Testability | **1** | Almost no automated tests beyond minimal E2E smoke |
| Documentation | **4** | Strong internal methodology docs; weak repo onboarding and API docs |

**Composite health (weighted): ~4 / 10**  
**Production risk:** **High** until critical security and data-access issues are addressed.

### 1.2 Counts at a glance

| Category | Approximate count |
|----------|-------------------|
| Critical findings | 14 |
| High-priority warnings | 18 |
| Medium suggestions | 15 |
| Frontend source files (`src/`) | ~130+ |
| Backend source files (`backend/src/`) | ~50+ |
| Estimated automated test coverage | **&lt; 2%** |

### 1.3 Top five actions (highest ROI)

1. **Security baseline:** Add `helmet`, `express-rate-limit`, and strict JWT startup validation in all environments where the API is exposed.
2. **Authorization:** Audit every handler that accepts IDs (scan, audit, project) and enforce `userId` / ownership checks consistently.
3. **Database I/O:** Use Prisma `select` (and eventually slimmer DTOs or summary tables) for `VisibilityScan` so history and “latest” endpoints do not pull multi-megabyte JSON blobs by default.
4. **Frontend delivery:** Introduce route-level code splitting (`React.lazy` + `Suspense`) for the dashboard and heavy libraries loaded on demand.
5. **Observability:** Replace silent `catch {}` / `.catch(() => {})` with structured logging and user-visible error states where appropriate.

---

## 2. Technology stack

### 2.1 Frontend

| Layer | Technology | Notes |
|-------|------------|--------|
| UI library | React 18 | Stable choice |
| Build | Vite 6 | Modern, fast |
| Styling | Tailwind CSS 3 | Consistent with shadcn-style components |
| Components | Radix UI primitives | Good accessibility baseline |
| Routing | React Router 6 | Standard SPA routing |
| Charts | Recharts | Large dependency; consider lazy loading chart routes |
| Maps | react-simple-maps | Heavy; duplicate usage in some pages doubles work |
| Forms | react-hook-form + zod | Good pattern |
| HTTP | `fetch` via `apiClient.js` | Central client is good |

**Dependency concerns**

- **Duplicate date libraries:** Both `date-fns` and `moment` are present; `moment` is legacy and increases bundle size.
- **Heavy optional features in main bundle:** `three`, `xlsx`, `html2canvas`, `jspdf` should be loaded only on routes that need them.
- **Root `zod` ^3.x vs backend `zod` ^4.x:** Two major versions across packages can confuse shared validation patterns if types/schemas are ever shared.

### 2.2 Backend

| Layer | Technology | Notes |
|-------|------------|--------|
| Runtime | Node.js (ESM) | `type: "module"` |
| Framework | Express 4 | Monolithic API server |
| ORM | Prisma 5 | PostgreSQL datasource in schema |
| Auth | JWT (`jsonwebtoken`) + bcryptjs | Password hashing acceptable if rounds configured |
| AI | Google Generative AI SDK, Infatica integration | External dependency risk and cost exposure |
| Queue | Bull + Redis (optional) | Email queue; Redis often off in dev |

### 2.3 Data store

- **Prisma schema** targets **PostgreSQL** (`datasource db`).
- Large scan payloads stored as **stringified JSON in `Text` columns** (`VisibilityScan.results`, `VisibilityScan.allRuns`) — see §5.2.

### 2.4 DevOps and delivery

- **CI:** GitHub Actions (`deploy-pages.yml`) — frontend-oriented; verify whether tests/lint run on every PR.
- **Hosting:** Firebase config present; `render.yaml` for backend-style deploy.
- **Docker:** No Dockerfile found in the audited tree — reproducible deploys and local parity are harder.

---

## 3. Project structure and architecture

### 3.1 Strengths

- **Route modules** under `backend/src/routes/` map to domains (auth, visibility, projects, content, audit, agent, waitlist, onboarding).
- **Services** encapsulate Infatica, scoring, parsing, and AI workflows — the dependency graph between services is generally acyclic.
- **Repositories** exist for auth/projects/waitlist — partial separation of data access.

### 3.2 Weaknesses

- **`visibilityController.js` is oversized** (~1,100+ lines): mixes HTTP handling, orchestration, and transformation helpers. This increases regression risk and makes unit testing difficult.
- **Some controllers call Prisma directly** instead of a dedicated service layer — coupling HTTP to persistence details.
- **Frontend dashboard** imports many page-level components eagerly from `Dashboard.jsx`, producing a **single large bundle**.

### 3.3 “God object” files (illustrative)

| Path | Approx. lines | Risk |
|------|----------------|------|
| `src/components/dashboard/AIVisibilityPage.jsx` | ~1,800+ | Any state change can rerender a huge tree |
| `src/components/dashboard/SentimentGeoPage.jsx` | ~1,300+ | Maps + charts + tables in one module |
| `backend/src/controllers/visibilityController.js` | ~1,100+ | Hard to reason about and test |
| `backend/src/services/scoringEngine.js` | ~770+ | Complex algorithms need isolated tests |
| `backend/src/services/responseParser.js` | ~690+ | Parsing + sentiment + side effects |

---

## 4. Security audit (detailed)

### 4.1 Authentication and authorization

**JWT secret handling**

- `backend/src/middleware/auth.js` defines:
  - `const defaultSecret = 'your-secret-key-change-this-in-production';`
  - `const JWT_SECRET = process.env.JWT_SECRET || defaultSecret;`
- `backend/src/server.js` **does** enforce in **production** that `JWT_SECRET` is set and not equal to the default (startup exit).  
- **Residual risk:** Staging, preview, or misconfigured hosts where `NODE_ENV` is not `production` may still run with the default secret. **Recommendation:** Fail fast unless `JWT_SECRET` is set whenever `LISTEN` is public, or use a single config module that applies the same rules as production for hosted environments.

**Hardcoded development bypass**

- `backend/src/services/authService.js` contains logic tied to a fixed email (`harsh@searchlyst.com`) and a **hardcoded password** path for development login.  
- **Impact:** Source-controlled credentials are a supply-chain and insider-threat risk; accidental deployment misconfiguration could widen exposure.  
- **Recommendation:** Remove hardcoded passwords; use env-based test users, or OAuth-only dev accounts.

**Authorization (IDOR-style risks)**

- Audit identified patterns where **resource IDs** (e.g. scan UUIDs, audit job IDs) must be checked against **authenticated `userId`** on every read/update. Any endpoint that only verifies “a user is logged in” but not “this user owns the resource” allows **horizontal privilege escalation**.  
- **Recommendation:** Central helper, e.g. `assertScanOwnedByUser(scanId, userId)`, used by all visibility/audit handlers.

### 4.2 Transport and headers

- **HTTPS** is assumed to be terminated by the hosting layer; the app must not mix insecure cookies (if added later) over HTTP.
- **`helmet` is not used** — standard security headers (CSP, frameguard, MIME sniffing protection) are absent unless the reverse proxy adds them.
- **CORS** is implemented in `server.js` with origin callbacks; production should always set `FRONTEND_URL` explicitly.

### 4.3 Input validation

- Zod schemas exist (`backend/src/validations/schemas.js`) and middleware (`validate.js`), but **not every route** consistently validates body/query/params.  
- **Risk:** Unexpected shapes cause 500s or logic bugs; some vectors could amplify DoS (large JSON bodies).

**Recommendations**

- Enforce **global JSON body size limits** (`express.json({ limit: '…' })`).
- Apply **zod** (or similar) on all mutating routes and on IDs (UUID format, integer project IDs).

### 4.4 Rate limiting and abuse

- **No rate limiting** on authentication, OTP, scan start, or heavy AI endpoints.  
- **Impact:** Credential stuffing, OTP brute force, and API cost exhaustion.

### 4.5 CSRF

- SPA + Bearer JWT in `Authorization` header (typical) reduces classic CSRF for API calls, but **cookie-based auth** (if introduced) would require CSRF tokens. Document the intended auth model and enforce it consistently.

### 4.6 Dependency security

- Run **`npm audit`** on root and `backend/` regularly; automate in CI.
- Pin critical AI/provider SDK versions after testing upgrades.

### 4.7 Secrets in repository

- `.env.example` files are appropriate templates.
- **Avoid** committing real `.env`, `deploy.config`, or SQLite files with user data.
- Root `.gitignore` includes `*.md` — documentation may be **excluded from Git** unintentionally (see §9).

---

## 5. Performance audit (detailed)

### 5.1 Database access patterns

**Full-row reads**

- `VisibilityScan` rows include **large JSON strings**. `findMany` / `findFirst` without `select` pulls **all columns**, including `allRuns` and `results`.  
- **History endpoints** with `take` up to 100–200 can multiply payload size catastrophically.

**Mitigations**

- `select` only fields required for each endpoint (e.g. history summary: `id`, `created_at`, `status`, small derived fields).
- Consider **normalized tables** or **summary columns** updated at scan completion for dashboards.

**Indexes**

- Existing indexes on `VisibilityScan` include `userId`, `projectId`, and `[projectId, created_at]`.  
- **Evaluate** composite indexes matching real query filters: e.g. `[userId, status, created_at]`, `[userId, domain]` for latest/history patterns.

### 5.2 JSON storage

- Storing large JSON as **text** forces `JSON.parse` on read and prevents native DB indexing into inner fields.  
- **Migration path:** `Json` / `JsonB` (PostgreSQL) with careful rollout and backfill.

### 5.3 CPU and algorithmic cost

- **Scoring engine** paths may iterate competitors × runs × entities; dominant-entity selection per cell can be optimized with precomputed maps.  
- **Duplicate work:** Scoring may be computed per engine and again globally — profile and cache intermediate structures where safe.

### 5.4 Frontend bundle and runtime

- **No route-level code splitting** for dashboard sub-pages → very large initial JS download and parse time.  
- **Duplicate map instances** (e.g. main view + dialog) can parse GeoJSON twice.  
- **localStorage** used for large scan payloads risks **quota errors** and stale data.

### 5.5 Caching strategy

- **Server:** No HTTP cache headers for immutable completed scans; no short-TTL cache for list endpoints.  
- **Client:** Some sessionStorage/localStorage usage; no unified cache invalidation policy documented.

### 5.6 Long-running work on API process

- Visibility scans orchestrate many external calls; running them **inline on the API worker** reduces capacity for concurrent users.  
- **Queue + worker** pattern recommended for production scale.

---

## 6. Error handling and logging

### 6.1 Silent failures

- Numerous **`catch {}`** or **`catch (e) {}`** without logging obscure production failures (JSON parse, optional enrichment steps, URL parsing).  
- Frontend **`useEffect` fetches** sometimes use **`.catch(() => {})`**, hiding network errors from users.

### 6.2 Global process hygiene

- **No `unhandledRejection` / `uncaughtException` handlers** registered in `server.js` (only SIGINT/SIGTERM).  
- **Recommendation:** Log, metric, and controlled shutdown; avoid silent crashes.

### 6.3 Logging

- Predominantly **`console.log` / `console.error`**.  
- **Recommendation:** Structured logger (e.g. pino) with request IDs, log levels, and redaction of secrets.

---

## 7. Testing assessment

### 7.1 What exists

- **Playwright** E2E (`e2e/ai-visibility.spec.js`) — very limited smoke coverage.  
- **Ad-hoc Node scripts** under `backend/scripts/` — useful for manual QA, not a substitute for CI test suites.

### 7.2 What is missing

- **No unit test runner** configured for backend services/controllers.  
- **No component tests** for React.  
- **No contract tests** for API responses.

### 7.3 Recommended target

- **Vitest** for frontend utilities and pure functions.  
- **Vitest** or **Node test runner** for backend scoring/parser modules (highest business risk).  
- Expand Playwright to cover **login → scan → dashboard** happy path with assertions on API responses or visible data.

---

## 8. Documentation audit

### 8.1 Strengths

- `docs/METRICS_CALCULATION_BIBLE.md`, `docs/SCORING_AND_SENTIMENT_METHODOLOGY.md`, and related files show **serious product methodology documentation**.

### 8.2 Gaps

- **Root README** may be absent or untracked due to `*.md` in `.gitignore`.  
- **OpenAPI/Swagger** not present for `/api/*`.  
- **LICENSE / CONTRIBUTING / CHANGELOG** not established in repo.

---

## 9. Configuration, Git, and CI

### 9.1 Environment

- `backend/src/loadEnv.js` loads `.env` from backend root — good for predictable local dev.  
- `.env.example` at root and under `backend/` — good practice.

### 9.2 `.gitignore` concern

- Root `.gitignore` contains **`*.md`**, which ignores **all Markdown files** in the repository. That blocks normal documentation workflow unless files are force-added or the rule is scoped (e.g. ignore only `/scratch/*.md`).

### 9.3 Health and shutdown

- **`GET /health`** returns static JSON and does **not** verify database connectivity.  
- **Graceful shutdown** exits immediately without closing the HTTP server, draining in-flight requests, or disconnecting Prisma — risk of dropped requests during deploys.

---

## 10. Accessibility and UX (frontend)

- **Radix-based UI** components generally improve keyboard and ARIA support.  
- Custom dashboard surfaces should be reviewed for:
  - Meaningful **alt text** on informative images  
  - **Focus management** in dialogs  
  - **Semantic landmarks** (`main`, `nav`, headings) inside dense dashboards  

---

## 11. API design notes

- REST-style grouping under `/api/*` is clear.  
- **Versioning** (`/api/v1`) is not evident — consider before public third-party consumers.  
- **Pagination:** Some list endpoints use `take` without cursors; define a consistent pagination contract for growing tables (content, scans, audits).

---

## 12. Remediation roadmap (phased)

### Phase A — Security hardening (days)

- Add `helmet` and sensible defaults; tune CSP for SPA.  
- Add rate limiting on auth and expensive routes.  
- Remove dev-only credential bypass from source; use env-only test accounts.  
- Systematic IDOR audit on all ID-parameter routes.

### Phase B — Performance and cost (1–2 weeks)

- Prisma `select` for scan reads; slim history API.  
- Route-level lazy loading on frontend; dynamic import for maps, PDF, xlsx.  
- Drop `moment`; standardize on `date-fns`.

### Phase C — Reliability and operations (1–2 weeks)

- Structured logging + redaction; global rejection handlers.  
- Health check with DB ping; graceful shutdown (server.close, prisma.$disconnect).  
- Optional Redis cache for immutable scan summaries.

### Phase D — Quality (ongoing)

- Vitest for `scoringEngine`, `responseParser`, auth helpers.  
- CI gate: lint + unit tests + `npm audit` (where feasible).

---

## 13. Appendix — Key file index

| Area | Paths |
|------|--------|
| Server entry | `backend/src/server.js` |
| Auth middleware | `backend/src/middleware/auth.js` |
| Auth service | `backend/src/services/authService.js` |
| Visibility API | `backend/src/routes/visibility.js`, `backend/src/controllers/visibilityController.js` |
| Scoring | `backend/src/services/scoringEngine.js` |
| Parsing | `backend/src/services/responseParser.js` |
| Prisma schema | `backend/prisma/schema.prisma` |
| Frontend API client | `src/api/apiClient.js` |
| Dashboard shell | `src/pages/Dashboard.jsx` |
| CI | `.github/workflows/deploy-pages.yml` |

---

## 14. Document control

- **Report generated from:** Codebase review (static analysis + architecture pass).  
- **Not included:** Penetration test, dependency CVE scan output, or runtime profiling — recommend running those separately and attaching results.  
- **Git note:** If this file does not appear in `git status`, check root `.gitignore` for `*.md` and add an exception, e.g. `!docs/PROJECT_AUDIT_REPORT.md`, or use `git add -f docs/PROJECT_AUDIT_REPORT.md`.

---

*End of report.*
