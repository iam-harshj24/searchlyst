# Searchlyst Deployment Guide

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

## Quick Local Verify

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev

# Test
cd backend && node scripts/test-user-flow.mjs
```
