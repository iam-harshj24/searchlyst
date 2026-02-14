# Fix Cloud SQL Connection - Authorize Your IP

## Problem

The backend cannot connect to Cloud SQL because your local IP address is not authorized.

## Solution: Add Your IP to Authorized Networks

### Step 1: Get Your Public IP

Run this command to get your public IP:

```bash
curl ifconfig.me
```

Or visit: https://whatismyipaddress.com/

### Step 2: Add IP to Cloud SQL

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **SQL** (or search for "Cloud SQL")
3. Click on your instance: **searchlyst**
4. Click on **"Connections"** in the left sidebar
5. Under **"Authorized networks"**, click **"Add Network"**
6. Enter:
   - **Name**: `Local Dev Machine` (or any name)
   - **Network**: `YOUR_PUBLIC_IP/32` (e.g., `203.0.113.42/32`)
7. Click **"Done"**
8. Click **"Save"** at the bottom

### Step 3: Verify Connection

After authorizing your IP, test the connection:

```bash
PGPASSWORD=admin951753 psql -h 34.131.130.234 -U admin -d searchlyst -c "SELECT version();"
```

If this works, you'll see the PostgreSQL version.

### Step 4: Restart Backend

```bash
cd backend
npm run dev
```

You should now see:

```
✓ Connected to PostgreSQL database
✓ Database tables initialized
✓ Email service is ready to send messages
✓ Server is running on port 3000
```

## Alternative: Allow All IPs (For Testing Only!)

⚠️ **Not recommended for production!**

If you want to quickly test, you can temporarily allow all IPs:

1. In Cloud SQL Connections
2. Add network: `0.0.0.0/0`

This allows connections from anywhere. **Remove this after testing!**

## Current Configuration

Your `.env` file is already configured correctly:

```
DATABASE_URL=postgresql://admin:admin951753@34.131.130.234:5432/searchlyst
```

The backend code is ready and waiting for the connection to work!

## Once Connected

After the database connection works:

1. ✅ Backend will automatically create the `waitlist` table
2. ✅ All API endpoints will be functional
3. ✅ Frontend can submit waitlist forms
4. ✅ Admin panel will display entries
5. ✅ Emails will be sent to krishnasaxena69@gmail.com

Everything else is already implemented and ready to go! 🚀
