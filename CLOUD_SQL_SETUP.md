# Google Cloud SQL Connection Setup

## Current Issue

The Cloud SQL Proxy is failing to authenticate with error:
```
invalid_grant: reauth related error (invalid_rapt)
```

This means your Google Cloud credentials need to be refreshed.

## Solution 1: Re-authenticate (Recommended for Development)

Run this command in your terminal:

```bash
gcloud auth application-default login
```

This will open a browser window to log into your Google account and refresh your credentials.

After authentication, restart the backend:
```bash
cd backend
npm run dev
```

## Solution 2: Use Service Account (Recommended for Production)

1. **Create a Service Account** in Google Cloud Console:
   - Go to IAM & Admin > Service Accounts
   - Create a new service account
   - Grant it "Cloud SQL Client" role
   
2. **Download the JSON key file**:
   - Click on the service account
   - Go to "Keys" tab
   - Add Key > Create new key > JSON
   - Save the file (e.g., `service-account-key.json`)

3. **Update the backend .env**:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   ```

4. **Restart everything**:
   ```bash
   # Kill the proxy
   pkill cloud-sql-proxy
   
   # Start proxy with service account
   ./cloud-sql-proxy searchlyst:asia-south2:searchlyst --port 5433 --credentials-file=/path/to/service-account-key.json
   
   # Start backend
   cd backend && npm run dev
   ```

## Solution 3: Use Public IP (Quick Test)

If you just want to test quickly without the proxy:

1. **Enable Public IP** on your Cloud SQL instance:
   - Go to Cloud SQL Instances
   - Select your instance
   - Go to "Connections"
   - Enable "Public IP"
   - Add authorized network: `0.0.0.0/0` (for testing only!)

2. **Get the Public IP address** from the Cloud SQL instance page

3. **Update backend/.env**:
   ```
   DATABASE_URL=postgresql://admin:admin951753@YOUR_PUBLIC_IP:5432/searchlyst
   ```

4. **Add SSL configuration** in `backend/src/config/database.js`:
   ```javascript
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: { rejectUnauthorized: false }
   });
   ```

⚠️ **Warning**: Using public IP with `0.0.0.0/0` is insecure. Only use for testing!

## Current Setup Status

✅ Cloud SQL Proxy installed
✅ Backend code complete  
✅ Frontend code complete
✅ Email service configured
❌ Database connection failing (auth issue)

## Quick Start (After Authentication)

Once authentication is fixed:

```bash
# Terminal 1 - Cloud SQL Proxy
./cloud-sql-proxy searchlyst:asia-south2:searchlyst --port 5433

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Frontend (if not running)
npm run dev
```

## Verify Connection

Test the database connection:

```bash
psql "postgresql://admin:admin951753@localhost:5433/searchlyst"
```

If it connects successfully, the backend will work too!

## Need Help?

If authentication issues persist, consider using Solution 3 (Public IP) for immediate testing, then switch to proper authentication for production use.
