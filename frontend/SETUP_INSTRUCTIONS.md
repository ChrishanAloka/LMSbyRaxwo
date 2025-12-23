# Admin Login System Setup Instructions

## Complete Admin Authentication System with JWT

This guide will help you set up the complete admin login system with JWT authentication.

---

## Prerequisites

- Node.js installed
- MongoDB (local or Atlas)
- Postman (for API testing)

---

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd LMS-System-Back-End
```

### 2. Install Dependencies (if not already installed)
```bash
npm install
```

### 3. Create `.env` File
Create a `.env` file in the backend root with:
```env
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/lms
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

**Replace:**
- `MONGO_URI` with your MongoDB connection string
- `JWT_SECRET` with a secure random string (minimum 32 characters)

### 4. Start Backend Server
```bash
npm start
```

You should see:
```
Server Started on https://lms-tili.onrender.com
Database Connected Successfully
```

---

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd LMS-System-Front-End
```

### 2. Install Dependencies (if not already installed)
```bash
npm install
```

### 3. Start Frontend Server
```bash
npm run dev
```

You should see:
```
VITE ready at http://localhost:5174
```

---

## Testing with Postman

### Step 1: Register an Admin

**POST** `https://lms-tili.onrender.com/api/admin/auth/register`

**Body (raw JSON):**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "admin": {
      "id": "...",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### Step 2: Login to Get Token

**POST** `https://lms-tili.onrender.com/api/admin/auth/login`

**Body (raw JSON):**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "...",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "eyJhbGc..."
  }
}
```

**Copy the token from the response!**

### Step 3: Test Protected Route

**GET** `https://lms-tili.onrender.com/api/admin/dashboard`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Expected Response:**
Dashboard data with metrics and courses

---

## Testing with Frontend

### 1. Open Browser
Navigate to: `http://localhost:5174/admin/login`

### 2. Login
Enter your admin credentials:
- Email: `admin@example.com`
- Password: `admin123`

### 3. Access Dashboard
After successful login, you'll be redirected to:
`http://localhost:5174/admin/Dashboard`

---

## File Structure

### Backend Files Created:
```
LMS-System-Back-End/
├── models/
│   └── Admin.js                 # Admin model with JWT
├── controllers/
│   └── authController.js        # Login, register, getMe
├── middleware/
│   └── authMiddleware.js        # JWT protection
├── routes/
│   ├── authRoutes.js            # Auth endpoints
│   └── adminRoutes.js           # Protected admin routes
└── server.js                    # Updated with auth routes
```

### Frontend Files Created:
```
LMS-System-Front-End/
├── src/
│   ├── pages/admin/
│   │   ├── LoginPage.jsx        # Login page
│   │   └── LoginPage.css        # Login styles
│   ├── components/
│   │   └── ProtectedRoute.jsx   # Route protection
│   └── App.jsx                  # Updated routes
└── POSTMAN_API_DOCUMENTATION.md # Complete API docs
```

---

## Features Implemented

✅ **Backend:**
- Admin registration and login
- JWT token generation and verification
- Password hashing with bcrypt
- Protected routes with middleware
- Role-based access control
- Error handling

✅ **Frontend:**
- Beautiful login page
- Protected route wrapper
- Token storage in localStorage
- Auto-redirect on logout
- Error handling

✅ **Security:**
- Password hashing
- JWT tokens with expiry (30 days)
- Token validation
- Account status checking
- CORS configuration

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/admin/auth/register | Register admin | No |
| POST | /api/admin/auth/login | Login admin | No |
| GET | /api/admin/auth/me | Get current admin | Yes |
| GET | /api/admin/dashboard | Get dashboard data | Yes |

---

## Troubleshooting

### 1. "Cannot find module" error
```bash
npm install
```

### 2. MongoDB connection error
- Check your `MONGO_URI` in `.env`
- Ensure MongoDB is running
- Check network/firewall settings

### 3. JWT token not working
- Check if `JWT_SECRET` is set in `.env`
- Clear browser localStorage and login again

### 4. CORS errors
- Backend is configured with `cors()` middleware
- Check if frontend URL is allowed

---

## Next Steps

1. Add more admin roles (super_admin)
2. Implement password reset functionality
3. Add email verification
4. Implement refresh tokens
5. Add logging and monitoring
6. Deploy to production

---

## Security Best Practices

- Change default JWT_SECRET in production
- Use HTTPS in production
- Implement rate limiting
- Add request validation
- Use environment variables for secrets
- Regular security audits

---

## Support

For issues or questions, refer to:
- `POSTMAN_API_DOCUMENTATION.md` for API details
- MongoDB Atlas documentation for database setup
- React Router docs for frontend routing
