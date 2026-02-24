# AGENTS.md

## Cursor Cloud specific instructions

This is a **frontend-only React + Vite SPA** (the "searchlyst" product) built on the Base44 low-code platform. There is no local backend service; all data comes from a remote Base44 API.

### Quick reference

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (Vite, default port 5173) |
| Lint | `npm run lint` |
| Lint fix | `npm run lint:fix` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |

### Key caveats

- **No `.env.local` is committed.** The app needs `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL` in `.env.local` for full backend connectivity. Without them, the landing/marketing pages still render, but authenticated dashboard features will not work.
- **Pre-existing lint errors:** The codebase has ~67 unused-import lint errors. These are pre-existing and should not block development.
- **`npm run typecheck`** runs `tsc` against `jsconfig.json`, scoped to `src/components/**/*.js`, `src/pages/**/*.jsx`, and `src/Layout.jsx`.
- The Vite config uses the `@base44/vite-plugin` which provides HMR notifications, navigation tracking, and visual edit agent support. If `VITE_BASE44_APP_BASE_URL` is not set, it logs a warning but the dev server works fine.
