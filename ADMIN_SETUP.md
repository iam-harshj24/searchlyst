# Admin Panel Authentication Setup

## ✅ What's Been Implemented

- JWT-based authentication
- Protected admin routes
- Login page with secure token storage
- Automatic token verification
- Logout functionality
- Password hashing with bcrypt

## 🚀 Create Your First Admin User

You need to create an admin account to access the admin panel.

### Step 1: Create Admin User

Use this curl command (backend must be running):

```bash
curl -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@searchlyst.com",
    "password": "YourSecurePassword123",
    "name": "Admin User"
  }'
```

Or use this simpler format:

```bash
curl -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@searchlyst.com","password":"Admin@123","name":"Admin"}'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "admin": {
    "id": 1,
    "email": "admin@searchlyst.com",
    "name": "Admin"
  }
}
```

### Step 2: Login

1. Go to: http://localhost:5173/Login
2. Enter your credentials:
   - Email: `admin@searchlyst.com`
   - Password: `Admin@123` (or whatever you set)
3. Click "Login"

### Step 3: Access Admin Panel

After successful login, you'll be automatically redirected to:
http://localhost:5173/AdminPanel

## 🔒 Security Features

✅ **JWT Tokens** - 7-day expiration
✅ **Password Hashing** - Bcrypt with salt
✅ **Protected Routes** - Admin panel requires authentication
✅ **Token Verification** - Automatic on page load
✅ **Secure Logout** - Clears tokens from localStorage

## 📱 Using the Admin Panel

Once logged in, you can:

- ✅ View all waitlist entries
- ✅ Search and filter entries
- ✅ Update entry status (pending → contacted → converted)
- ✅ Export to CSV
- ✅ Logout securely

## 🔐 API Endpoints

### Public Endpoints
- `POST /api/waitlist` - Submit waitlist form
- `POST /api/auth/login` - Login to admin

### Protected Endpoints (Require JWT Token)
- `GET /api/waitlist` - Get all entries
- `GET /api/waitlist/stats` - Get statistics
- `PUT /api/waitlist/:id` - Update entry status
- `GET /api/auth/verify` - Verify token validity

## 🛡️ Security Best Practices

### For Production:

1. **Change JWT Secret**
   Update in `backend/.env`:
   ```
   JWT_SECRET=your-very-long-random-secret-key-here
   ```

2. **Remove Setup Endpoint**
   After creating your admin user, comment out the setup route in `backend/src/routes/auth.js`:
   ```javascript
   // router.post('/setup', createAdmin); // Disabled for security
   ```

3. **Add HTTPS**
   Use HTTPS in production to encrypt token transmission

4. **Add Rate Limiting**
   Limit login attempts to prevent brute force attacks

5. **Add Password Requirements**
   Enforce strong password policies

## 🔄 Token Flow

```
1. User logs in → Server generates JWT
2. Frontend stores token in localStorage
3. Every API request includes token in Authorization header
4. Server validates token before processing request
5. Invalid/expired token → Redirect to login
```

## 🐛 Troubleshooting

### "Access token required" error
- Make sure you're logged in
- Token might be expired (login again)
- Clear browser cache and localStorage

### Can't create admin user
- Check backend is running on port 3000
- Verify database is connected
- Check if admin already exists (email must be unique)

### Redirected to login immediately
- Token might be expired
- Try logging in again
- Check browser console for errors

## 📊 Database Tables

### admin_users table
```sql
id: SERIAL PRIMARY KEY
email: VARCHAR(255) NOT NULL UNIQUE
password_hash: VARCHAR(255) NOT NULL
name: VARCHAR(255) NOT NULL
created_at: TIMESTAMP
last_login: TIMESTAMP
```

## 🎯 What's Next

Your admin panel is now fully secured! Only authenticated users can:
- Access /AdminPanel
- View waitlist entries
- Update entry statuses
- Export data

The waitlist submission form remains public for anyone to use.

## 🆘 Need Help?

If you have issues:
1. Check backend logs for errors
2. Verify database connection
3. Ensure JWT_SECRET is set in .env
4. Try creating admin user again
5. Clear browser localStorage and try login again

All done! Your admin panel is now secure with JWT authentication! 🎉
