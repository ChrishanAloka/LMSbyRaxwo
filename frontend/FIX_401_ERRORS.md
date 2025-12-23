# Fix 401 Unauthorized Errors

## Problem
API calls are failing with 401 Unauthorized errors because:
1. Token is missing or expired
2. Token is not being sent correctly
3. No error handling for authentication failures

## Solution
Created `apiHelper.js` utility that:
- Automatically adds Authorization header
- Handles 401 errors by redirecting to login
- Checks if token exists before making requests

## How to Fix Other Pages

### Option 1: Use `authenticatedFetch` (Recommended)

**Before:**
```javascript
const token = localStorage.getItem('adminToken');
const response = await fetch(`${API_CONFIG.API_URL}/students`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**After:**
```javascript
import { authenticatedFetch } from '../../utils/apiHelper';

const response = await authenticatedFetch(`${API_CONFIG.API_URL}/students`, {
  method: 'GET',
});
```

### Option 2: Use `getAuthHeaders` Helper

**Before:**
```javascript
const token = localStorage.getItem('adminToken');
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**After:**
```javascript
import { getAuthHeaders } from '../../utils/apiHelper';

const response = await fetch(url, {
  headers: {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
  }
});

// Then check for 401:
if (response.status === 401) {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('user');
  window.location.href = '/admin/login';
  return;
}
```

## Pages That Need Fixing

Check these pages and apply the fix:
- [x] StudentsPage.jsx - ✅ Fixed
- [ ] PaymentPage.jsx
- [ ] SubjectsPage.jsx
- [ ] MarksPage.jsx
- [ ] ExamPage.jsx
- [ ] ClassesViewPage.jsx
- [ ] EmployeePage.jsx
- [ ] SalaryPage.jsx
- [ ] ClassPage.jsx
- [ ] IncomePage.jsx
- [ ] ExtraIncomePage.jsx
- [ ] ExpensesPage.jsx
- [ ] AdminDashboard.jsx

## Quick Fix Script

You can use find/replace in your editor:

**Find:**
```javascript
const token = localStorage.getItem('adminToken');
```

**Replace with:**
```javascript
import { authenticatedFetch, getAuthHeaders } from '../../utils/apiHelper';
```

Then update all fetch calls to use `authenticatedFetch` or add `getAuthHeaders()`.

## Testing

1. Clear localStorage: `localStorage.clear()`
2. Try to access any admin page
3. Should redirect to login
4. After login, all API calls should work
5. If token expires, should auto-redirect to login

