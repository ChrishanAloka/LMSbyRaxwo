# Employee Management API Documentation

## Base URL
```
https://lms-tili.onrender.com/api
```

---

## Employee Endpoints

All employee endpoints require authentication via JWT token in the header.

### 1. Get All Employees

**Endpoint:** `GET /admin/employees`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4b1a",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Teacher",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 2. Create Employee

**Endpoint:** `POST /admin/employees`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Teacher"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "id": "60d5ec49f1b2c72b8c8e4b1a",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Teacher",
    "status": "active"
  }
}
```

**Error Responses:**
- `400`: Missing required fields
- `400`: Employee already exists with this email
- `401`: Not authorized

---

### 3. Get Single Employee

**Endpoint:** `GET /admin/employees/:id`

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
    "_id": "60d5ec49f1b2c72b8c8e4b1a",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Teacher",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update Employee

**Endpoint:** `PUT /admin/employees/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "John Updated",
  "email": "johnnew@example.com",
  "role": "Senior Teacher",
  "status": "active"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "id": "60d5ec49f1b2c72b8c8e4b1a",
    "name": "John Updated",
    "email": "johnnew@example.com",
    "role": "Senior Teacher",
    "status": "active"
  }
}
```

---

### 5. Delete Employee

**Endpoint:** `DELETE /admin/employees/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

---

### 6. Get Available Roles

**Endpoint:** `GET /admin/employees/roles`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "data": ["Teacher", "Administrator", "Manager", "Supervisor"]
}
```

---

## Postman Examples

### Create Employee
```http
POST https://lms-tili.onrender.com/api/admin/employees
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Teacher"
}
```

### Update Employee
```http
PUT https://lms-tili.onrender.com/api/admin/employees/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "John Updated",
  "role": "Senior Teacher"
}
```

### Delete Employee
```http
DELETE https://lms-tili.onrender.com/api/admin/employees/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Database Schema

```javascript
Employee {
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String,
  status: String (active/inactive),
  createdAt: Date
}
```

---

## Frontend Features

✅ Add employee form with validation  
✅ Dynamic role dropdown  
✅ Add new roles on the fly  
✅ View all employees in a table  
✅ Delete employees with confirmation  
✅ Real-time form validation  
✅ Error handling  
✅ Loading states  
