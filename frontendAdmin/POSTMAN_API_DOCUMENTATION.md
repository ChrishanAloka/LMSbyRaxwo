# LMS System - Admin API Documentation

## Base URL
```
https://lms-f679.onrender.com/api
```

---

## Authentication Endpoints

### 1. Register New Admin (Optional - for initial setup)

**Endpoint:** `POST /admin/auth/register`

**Description:** Create a new admin account. This is typically used for initial setup.

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "admin": {
      "id": "60d5ec49f1b2c72b8c8e4b1a",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

**Error Responses:**
- `400`: Admin already exists
- `400`: Validation error

---

### 2. Login Admin

**Endpoint:** `POST /admin/auth/login`

**Description:** Authenticate admin and receive JWT token.

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "60d5ec49f1b2c72b8c8e4b1a",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZDVlYzQ5ZjFiMmM3MmI4YzhlNGIxYSIsImlhdCI6MTYyNTEwMDAwMCwiZXhwIjoxNjI3Njk5OTk5fQ.example"
  }
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `401`: Account deactivated

---

### 3. Get Current Admin Profile

**Endpoint:** `GET /admin/auth/me`

**Description:** Get current authenticated admin's profile.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "60d5ec49f1b2c72b8c8e4b1a",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "status": "active"
    }
  }
}
```

**Error Responses:**
- `401`: Not authorized, no token
- `401`: Invalid token

---

## Protected Admin Endpoints

### 4. Get Dashboard Data

**Endpoint:** `GET /admin/dashboard`

**Description:** Get admin dashboard statistics.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "message": "Admin dashboard data",
  "metrics": [
    {
      "label": "Total earnings",
      "value": "$17,280",
      "icon": "📈",
      "color": "#22C55E"
    },
    {
      "label": "Earnings to paid",
      "value": "$1,280",
      "icon": "📉",
      "color": "#EF4444"
    }
  ],
  "topCourses": [
    {
      "name": "UX for business",
      "enrollments": 163,
      "price": "$49.99",
      "color": "#8B5CF6"
    }
  ],
  "totalSales": 25000,
  "status": "success"
}
```

---

## Postman Collection

### Setup Instructions:

1. **Create Environment Variables:**
   - `base_url`: `https://lms-f679.onrender.com/api`
   - `token`: (leave empty, will be set automatically)

2. **Import Requests:**

#### Register Admin
```
POST {{base_url}}/admin/auth/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123"
}
```

#### Login Admin
```
POST {{base_url}}/admin/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Add Tests Script (to save token automatically):**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
}
```

#### Get Current Admin
```
GET {{base_url}}/admin/auth/me
Authorization: Bearer {{token}}
Content-Type: application/json
```

#### Get Dashboard Data
```
GET {{base_url}}/admin/dashboard
Authorization: Bearer {{token}}
Content-Type: application/json
```

---

## Testing with cURL

### Login
```bash
curl -X POST https://lms-f679.onrender.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### Get Dashboard (with token)
```bash
curl -X GET https://lms-f679.onrender.com/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Register Admin
```bash
curl -X POST https://lms-f679.onrender.com/api/admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123"
  }'
```

---

## Environment Setup

Create a `.env` file in the backend root:

```env
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/lms
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation Error |
| 401 | Unauthorized - Invalid credentials/token |
| 403 | Forbidden - Insufficient permissions |
| 500 | Internal Server Error |

---

## Security Notes

1. **JWT Token Expiry:** Tokens expire after 30 days
2. **Password Requirements:** Minimum 6 characters
3. **Password Hashing:** All passwords are hashed using bcrypt
4. **Token Storage:** Store JWT token securely (localStorage/HttpOnly cookies in production)
5. **HTTPS:** Always use HTTPS in production
6. **CORS:** Configure CORS properly for production

---

## Example Workflow

1. Start backend server: `npm start` (in backend directory)
2. Register first admin via Postman/cURL
3. Login to get JWT token
4. Use token in Authorization header for protected routes
5. Access admin dashboard data
