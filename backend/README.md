# Searchlyst Backend

Node.js/Express backend API for managing waitlist signups and sending email notifications.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure PostgreSQL

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE searchlyst;

# Exit psql
\q
```

The backend will automatically create the necessary tables when it starts.

### 3. Configure Environment Variables

Copy the `.env.example` file to `.env` and update with your values:

```bash
cp .env.example .env
```

Required environment variables:

- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql://username:password@localhost:5432/searchlyst`
- `SMTP_HOST`: Email server host (e.g., smtp.gmail.com)
- `SMTP_PORT`: Email server port (usually 587)
- `SMTP_USER`: Email address to send from (admin@camanahomes.com)
- `SMTP_PASSWORD`: Email password or app-specific password
- `NOTIFICATION_EMAIL`: Email to receive notifications (krishnasaxena69@gmail.com)

#### Setting up Gmail SMTP

If using Gmail for `admin@camanahomes.com`:

1. Enable 2-factor authentication on the Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate a new app password for "Mail"
   - Use this password in `SMTP_PASSWORD`

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- **GET** `/health` - Server health status

### Waitlist Management

- **POST** `/api/waitlist` - Create new waitlist entry
  ```json
  {
    "full_name": "John Doe",
    "email": "john@example.com",
    "website_url": "https://example.com",
    "source": "home"
  }
  ```

- **GET** `/api/waitlist` - Get all waitlist entries
  
- **GET** `/api/waitlist/stats` - Get waitlist statistics
  
- **PUT** `/api/waitlist/:id` - Update entry status
  ```json
  {
    "status": "contacted"
  }
  ```

## Email Notifications

When a new waitlist entry is created, an email notification is automatically sent to `krishnasaxena69@gmail.com` from `admin@camanahomes.com` with the signup details.

## Database Schema

```sql
CREATE TABLE waitlist (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    website_url VARCHAR(500),
    source VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Database Connection Issues

If you see database connection errors:
1. Verify PostgreSQL is running: `pg_isready`
2. Check database exists: `psql -l`
3. Verify connection string in `.env`

### Email Issues

If emails are not sending:
1. Verify SMTP credentials are correct
2. Check that 2FA and App Password are set up (for Gmail)
3. Look for email errors in server logs

## Security Notes

- Never commit `.env` file to version control
- Use app-specific passwords for email services
- Consider adding rate limiting for production
- Add authentication to admin endpoints in production
