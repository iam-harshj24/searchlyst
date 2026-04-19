# Searchlyst Deployment Guide

> **Active deployment target:** GCP staging (Compute Engine VM + Cloud SQL Postgres in `asia-south1`).
> See [GCP Staging Deployment](#gcp-staging-deployment) below.
> The legacy Render + GitHub Pages flow further down is kept for reference only.

---

## GCP Staging Deployment

Single-VM staging environment with managed PostgreSQL, deployed via GitHub Actions.

### Architecture

| Component | Where | Notes |
|---|---|---|
| Frontend (React/Vite) | Compute Engine VM (`searchlyst-staging-vm`, e2-small) | Served by container nginx, fronted by host nginx |
| Backend (Express API) | Same VM, Docker container | `/api/*` reverse-proxied by host nginx |
| Database | Cloud SQL for PostgreSQL 16 (`searchlyst-staging-db`, db-f1-micro, private IP) | Reached via Cloud SQL Auth Proxy sidecar |
| Image registry | Artifact Registry (`asia-south1-docker.pkg.dev/<project>/searchlyst`) | Built & pushed by GitHub Actions |
| TLS | Not enabled in staging by default | Run `infra/gcp/setup-tls.sh` after pointing a domain at the VM IP |

### One-time setup

1. **GCP account** — Create a Google account, accept the $300 free trial, create a project (note the `PROJECT_ID`), and add a budget alert (Billing → Budgets & alerts, $20/mo recommended).
2. **Local CLIs** — Install [`gcloud`](https://cloud.google.com/sdk/docs/install) and [Terraform 1.6+](https://developer.hashicorp.com/terraform/install). Then:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```
3. **Create the Terraform state bucket** (one-time per project):
   ```bash
   export GCP_PROJECT_ID=your-project-id
   bash infra/terraform/bootstrap-state-bucket.sh
   ```
4. **Edit [infra/terraform/envs/staging.tfvars](infra/terraform/envs/staging.tfvars)** and set `project_id` and `alert_email`.
5. **Provision infra**:
   ```bash
   cd infra/terraform
   ENV=staging make init     # init backend + select workspace
   ENV=staging make plan     # preview
   ENV=staging make apply    # ~12 min the first time (Cloud SQL is the slow part)
   ```
6. **GitHub Secrets** — Print the values to copy into **Settings → Secrets and variables → Actions**:
   ```bash
   ENV=staging make secrets
   ```

The state bucket holds the Cloud SQL password and the GHA service-account JSON key — keep it private (the bootstrap script enables uniform access and public-access prevention).

### Deploying

| Trigger | What happens |
|---|---|
| `git push origin main` | Builds + pushes images, SSHes into VM, `docker compose up -d`, smoke-tests `http://<VM_IP>/health` |
| `Actions → Deploy to Staging → Run workflow` | Same as above, on demand |

The deploy uses the commit SHA as the image tag, plus a `staging-latest` tag. To roll back, re-run the workflow on a previous green commit.

### Adding a real domain + HTTPS later

Once you've registered a domain (e.g. on Hostinger):

1. Create an **A record** (not CNAME) for `staging.your-domain.com` pointing to the VM's static IP (printed by the bootstrap script, also visible via `gcloud compute addresses describe searchlyst-staging-ip --region=asia-south1`).
2. Wait for DNS to propagate: `dig +short staging.your-domain.com` should return the VM IP.
3. Run on the VM:

   ```bash
   gcloud compute scp --tunnel-through-iap --zone=asia-south1-a \
     infra/gcp/setup-tls.sh searchlyst-staging-vm:/tmp/

   gcloud compute ssh --tunnel-through-iap --zone=asia-south1-a \
     searchlyst-staging-vm --command='sudo STAGING_DOMAIN=staging.your-domain.com LE_EMAIL=you@example.com bash /tmp/setup-tls.sh'
   ```

4. Update the `FRONTEND_URL` GitHub secret to `https://staging.your-domain.com` and re-run the deploy workflow.

The frontend bundle uses a relative `/api` URL, so **no UI rebuild is needed when switching from IP to domain or from HTTP to HTTPS**.

### Adding a prod environment later

1. Use a **separate GCP project** for prod (blast-radius isolation).
2. `bash infra/terraform/bootstrap-state-bucket.sh` against the prod project.
3. Copy `envs/staging.tfvars` → `envs/prod.tfvars`, change `project_id`, set `environment = "prod"`, bump `vm_machine_type` and `db_tier`. Flip `deletion_protection = true` in [infra/terraform/modules/database/main.tf](infra/terraform/modules/database/main.tf).
4. `ENV=prod make init && ENV=prod make plan && ENV=prod make apply`.

The same modules and the same VM startup script are reused — no duplicated Terraform code.

### Database backups & monitoring

Configured automatically by Terraform (`modules/database`):

- Daily automated backups at 18:30 UTC (00:00 IST), 7-day retention.
- Point-in-time recovery (PITR) with 7-day transaction log retention — restore to any second in the last week.
- Maintenance window pinned to Sunday 20:00 IST.
- Cloud Monitoring alert policy `Cloud SQL backup failed (searchlyst-staging)` emails `ALERT_EMAIL` if a backup operation logs `severity>=ERROR`.

**How to track backups:**

| Method | Where / Command |
|---|---|
| Console UI | SQL → `searchlyst-staging-db` → **Backups** tab (status, size, type, one-click restore) |
| CLI list | `gcloud sql backups list --instance=searchlyst-staging-db` |
| CLI detail | `gcloud sql backups describe <BACKUP_ID> --instance=searchlyst-staging-db` |
| Alerts | Cloud Monitoring → Alerting → policy `Cloud SQL backup failed (searchlyst-staging)` |

**On-demand backup before a risky deploy:**

```bash
gcloud sql backups create --instance=searchlyst-staging-db \
  --description="pre-deploy $(git rev-parse --short HEAD)"
```

**Restore (PITR example):**

```bash
gcloud sql instances clone searchlyst-staging-db searchlyst-staging-db-restore \
  --point-in-time='2026-04-19T12:34:56.000Z'
```

### Useful operational commands

```bash
# Tail API logs on the VM
gcloud compute ssh --tunnel-through-iap --zone=asia-south1-a searchlyst-staging-vm \
  --command='sudo docker logs -f searchlyst-api'

# Open a Postgres shell from your laptop (requires Cloud SQL Auth Proxy locally)
cloud-sql-proxy <PROJECT>:asia-south1:searchlyst-staging-db &
psql "postgresql://searchlyst_app:<password>@127.0.0.1:5432/searchlyst"

# Re-run the VM startup script (e.g. after editing infra/gcp/vm-startup.sh)
gcloud compute ssh --tunnel-through-iap --zone=asia-south1-a searchlyst-staging-vm \
  --command='sudo google_metadata_script_runner startup'
```

### Cost (steady-state, asia-south1)

| Item | ~Monthly |
|---|---|
| e2-small VM + 20 GB pd-balanced | ~$13 |
| Static external IP | ~$3 |
| Cloud SQL db-f1-micro + 10 GB SSD + 7 days backups | ~$10 |
| Artifact Registry (small) + egress (low) | <$1 |
| **Total** | **~$25/month** |

Free trial credit ($300) covers ~12 months at this rate.

---

## Legacy: Render + GitHub Pages flow (reference only)

## Test Results ✅

- **Frontend build**: ✓
- **Visibility unit tests**: ✓
- **User flow API test**: ✓ (anonymous auth → scan → result)
- **Playwright E2E**: ✓ (3 tests passed)

---

## Making It Live

Searchlyst has two parts:
1. **Frontend** (React/Vite) → GitHub Pages or Firebase Hosting
2. **Backend** (Express API) → Render, Railway, or similar

### Step 1: Deploy Backend (Render.com)

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click **New** → **Blueprint**
3. Connect your `searchlyst` repo
4. Render will read `render.yaml` and create the `searchlyst-api` service
5. In the dashboard, add environment variables:
   - `DATABASE_URL` – your PostgreSQL connection string
   - `JWT_SECRET` – a strong random string (e.g. `openssl rand -hex 32`)
   - `GEMINI_API_KEY` – for AI features
   - `INFATICA_API_KEY` – for visibility scanning
   - `FRONTEND_URL` – your frontend URL (e.g. `https://username.github.io/searchlyst`)
6. Deploy and note the backend URL (e.g. `https://searchlyst-api.onrender.com`)

### Step 2: Deploy Frontend (GitHub Pages)

1. In your repo: **Settings** → **Secrets and variables** → **Actions**
2. Add secret `VITE_API_BASE_URL` = `https://your-backend-url.onrender.com/api`
3. Merge your branch to `main` and push:
   ```bash
   git checkout main
   git merge update-prompts-and-feature-for-launch
   git push origin main
   ```
4. The workflow deploys to GitHub Pages automatically
5. Frontend will be at `https://<username>.github.io/<repo-name>/`

### Step 3: CORS

On Render, set `FRONTEND_URL` to your exact GitHub Pages URL so the backend allows CORS from the frontend.

---

## Alternative: Firebase Hosting

```bash
npm run build
firebase deploy
```

Ensure `VITE_API_BASE_URL` is set when building if the API is on a different domain.

---

## Run the full product on localhost (one command)

1. **Backend env:** Copy `backend/.env` from `backend/.env.example` (or your existing file). Ensure `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL=http://localhost:5173` (or whatever port Vite prints).

2. **Frontend env:** Copy `.env.local.example` → `.env.local` in the **repo root** so the UI uses the local API:
   ```bash
   copy .env.local.example .env.local
   ```
   (Use `cp` on macOS/Linux.) This sets `VITE_API_BASE_URL=http://localhost:3000/api`.

3. **Install & migrate (first time):**
   ```bash
   npm install
   cd backend && npm install && npx prisma generate && npx prisma migrate deploy
   cd ..
   ```

4. **Start API + Vite together:**
   ```bash
   npm run dev:local
   ```

5. Open **http://localhost:5173** (Vite default). API health: **http://localhost:3000/health**.

---

## Quick Local Verify (two terminals)

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev

# Test
cd backend && node scripts/test-user-flow.mjs
```
