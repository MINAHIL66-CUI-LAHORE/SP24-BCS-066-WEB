```markdown
# Assignment 3 – User Authentication & Role-Based Access Control
### SP24-BCS-066 | Web Technologies
---
## Overview
This assignment extends the Adidas e-commerce application (Assignment 2) by implementing a robust **authentication system** with role-based access control. It allows users to register, log in securely, and distinguishes between a standard **Customer** and an **Admin**.

---

## How to Run

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Make sure your `.env` file contains:
```
MONGO_URI=mongodb://127.0.0.1:27017/adidas
PORT=3000
ADMIN_SECRET=adidas@admin123
SESSION_SECRET=adidas-secret-key
```

### 3. Seed the database (if not already done)
```bash
npm run seed
```

### 4. Start the server
```bash
npm run dev
```

---

## Accessing the App

| URL | Description |
|---|---|
| `http://localhost:3000` | Home page |
| `http://localhost:3000/auth/login` | User login page |
| `http://localhost:3000/auth/register` | User registration page |
| `http://localhost:3000/admin` | Admin panel (admin only) |
| `http://localhost:3000/admin/login` | Admin login page |
| `http://localhost:3000/checkout` | Checkout (logged-in users only) |
| `http://localhost:3000/access-denied` | Access denied page (403) |

---

## Features Implemented

### 1. User Model & Registration
- User schema with `name`, `email`, `password`, and `role` (defaults to `customer`)
- Passwords hashed using **bcryptjs** before saving — plain-text passwords never stored
- Email uniqueness validation
- Minimum password length of 6 characters enforced

### 2. Login & Session Management
- Login verifies email and compares hashed password using bcrypt
- Sessions managed with **express-session** and stored in MongoDB via **connect-mongo**
- Session cookie expires after 24 hours
- Dynamic navbar:
  - **Guest:** shows Login / Register
  - **Logged in:** shows Hi, [Name] | Log Out

### 3. Authorization Middleware

**isLoggedIn**
- Protects the `/checkout` route
- Redirects unauthenticated users to login page

**isAdmin**
- Applied to all `/admin` routes
- Checks if logged-in user's role is `admin`
- Non-admins are redirected to `/access-denied` with a 403 page
- Unauthenticated users are redirected to `/admin/login`

### 4. Flash Messages
- Integrated **connect-flash** for user feedback
- Flash messages shown for:
  - Invalid email or password on login
  - Successful logout
  - Access denied when non-admin visits `/admin`
  - Success/error messages in admin dashboard

---

## New Packages Added

| Package | Purpose |
|---|---|
| `bcryptjs` | Password hashing |
| `express-session` | Session management |
| `connect-mongo` | MongoDB session store |
| `connect-flash` | Flash messages |
```
