# Searchlyst - Complete Setup Guide

This guide will help you set up both the frontend and backend for the Searchlyst application.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **PostgreSQL** (v14 or higher)
   ```bash
   postgres --version
   ```

   If PostgreSQL is not installed:
   - **macOS**: `brew install postgresql@14`
   - **Ubuntu**: `sudo apt-get install postgresql-14`
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)

## Step 1: Database Setup

### Start PostgreSQL

```bash
# macOS with Homebrew
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Check status
pg_isready
```

### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql, create the database
CREATE DATABASE searchlyst;

# Connect to the database
\c searchlyst

# Exit psql
\q
```

Alternatively, use the setup script:

```bash
# Create database from command line
createdb searchlyst -U postgres

# Run the setup script
psql -U postgres -d searchlyst -f backend/setup.sql
```

## Step 2: Backend Configuration

### Navigate to Backend Directory

```bash
cd backend
```

### Configure Environment Variables

The `.env` file has been created with default values. Update the following:

1. **Database Configuration**
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/searchlyst
   ```
   Replace `YOUR_PASSWORD` with your PostgreSQL password.

2. **Email Configuration**
   
   For Gmail SMTP (admin@camanahomes.com):
   
   a. Enable 2-Factor Authentication on the Gmail account
   
   b. Generate an App Password:
      - Go to [Google Account Security](https://myaccount.google.com/security)
      - Click on "2-Step Verification"
      - Scroll to bottom and click "App passwords"
      - Select "Mail" and your device
      - Copy the generated 16-character password
   
   c. Update `.env`:
   ```
   SMTP_USER=admin@camanahomes.com
   SMTP_PASSWORD=your_16_char_app_password
   ```

### Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

You should see:
```
✓ Connected to PostgreSQL database
✓ Database tables initialized
✓ Email service is ready to send messages
✓ Server is running on port 3000
```

Keep this terminal open.

## Step 3: Frontend Configuration

### Open a New Terminal

Navigate to the project root:

```bash
cd ..  # From backend directory
```

### Start Frontend Development Server

The frontend is already configured with `.env.local`:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

Start the frontend:

```bash
npm run dev
```

The app should be available at: `http://localhost:5173`

## Step 4: Testing the Application

### Test Waitlist Signup

1. Open the app at `http://localhost:5173`
2. Fill out the waitlist form on the homepage
3. Submit the form
4. You should see a success message
5. Check `krishnasaxena69@gmail.com` for the notification email

### Test Admin Panel

1. Navigate to `http://localhost:5173/AdminPanel`
2. You should see the waitlist entries in a table
3. Try updating the status of an entry
4. Try the CSV export feature

### Test API Directly

You can also test the API endpoints directly:

```bash
# Health check
curl http://localhost:3000/health

# Get all waitlist entries
curl http://localhost:3000/api/waitlist

# Create a test entry
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "website_url": "https://example.com",
    "source": "home"
  }'
```

## Common Issues and Solutions

### Issue: Database Connection Failed

**Solution:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check your password in `backend/.env`
3. Ensure the database exists: `psql -U postgres -l | grep searchlyst`

### Issue: Email Not Sending

**Solution:**
1. Verify SMTP credentials in `backend/.env`
2. Ensure App Password is correctly generated (Gmail)
3. Check server logs for email errors
4. Test SMTP connection: The backend verifies on startup

### Issue: CORS Errors in Browser

**Solution:**
1. Ensure backend is running on port 3000
2. Verify frontend `.env.local` has correct API URL
3. Check backend allows frontend origin in CORS settings

### Issue: Port Already in Use

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in backend/.env
PORT=3001
```

## Project Structure

```
searchlyst/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js       # PostgreSQL connection
│   │   │   └── email.js          # Email configuration
│   │   ├── controllers/
│   │   │   └── waitlistController.js
│   │   ├── routes/
│   │   │   └── waitlist.js
│   │   ├── services/
│   │   │   └── emailService.js
│   │   └── server.js
│   ├── .env                      # Backend environment variables
│   └── package.json
├── src/
│   ├── api/
│   │   └── apiClient.js          # API client
│   ├── pages/
│   │   └── AdminPanel.jsx        # Admin panel
│   └── ...
├── .env.local                    # Frontend environment variables
└── package.json
```

## Next Steps

1. **Secure the Admin Panel**: Add authentication to protect admin routes
2. **Rate Limiting**: Add rate limiting to prevent spam
3. **Email Templates**: Enhance email notifications with better templates
4. **Production Deployment**: Configure for production deployment
5. **Monitoring**: Add logging and monitoring tools

## Support

If you encounter any issues:
1. Check the console logs in both terminals
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is running and accessible
4. Check the backend README.md for additional troubleshooting

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for database and email
- Enable HTTPS in production
- Add authentication to admin endpoints
- Consider using environment-specific configurations
