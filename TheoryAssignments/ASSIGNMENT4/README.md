# Assignment 4 – E-Commerce Admin Panel
### SP24-BCS-066 | Web Technologies

---

## Overview

This assignment extends the Adidas e-commerce application (Assignment 3) by adding a fully functional, password-protected **Admin Panel** at `/admin`. It allows authorized users to manage the product inventory through a clean dashboard with full CRUD operations and image upload support.

---

## How to Run

### 1. Install new dependencies
```bash
npm install multer cookie-parser
```

### 2. Create the uploads folder
```bash
mkdir -p public/uploads
```

### 3. Configure environment variables

Make sure your `.env` file contains:
```
MONGO_URI=mongodb://127.0.0.1:27017/adidas
PORT=3000
ADMIN_SECRET=adidas@admin123
```

### 4. Seed the database (if not already done)
```bash
npm run seed
```

### 5. Start the server
```bash
npm run dev
```

---

## Accessing the Admin Panel

| URL | Description |
|---|---|
| `http://localhost:3000/admin` | Redirects to login if not authenticated |
| `http://localhost:3000/admin/login` | Admin login page |
| `http://localhost:3000/admin/logout` | Clears session and logs out |

**Default password:** `adidas@admin123` (set in `.env` as `ADMIN_SECRET`)

---

## Features Implemented

### 1. Admin Layout & Navigation
- Separate EJS views under `views/admin/` with their own layout
- Fixed black sidebar with Adidas Barlow Condensed font
- Active link highlighting on current page
- Fully responsive — collapses to a hamburger menu on mobile

### 2. Product Dashboard
- Summary table showing all products from MongoDB
- Columns: Image, Name, Category, Price, Stock, Rating, Badge
- Stock values below 5 highlighted in red
- Star rating display

### 3. CRUD Operations

**Create** (`GET /admin/products/new` → `POST /admin/products`)
- Form with all product fields
- Client-side validation (JS alert) + server-side validation
- Empty field check before saving to database

**Read** (`GET /admin`)
- Fetches all products from MongoDB sorted by newest first
- Displays in a responsive table

**Update** (`GET /admin/products/:id/edit` → `POST /admin/products/:id?_method=PUT`)
- Edit button per product opens pre-filled form
- Uses method-override (`?_method=PUT`) since HTML forms only support GET/POST
- Existing image shown with option to replace

**Delete** (`POST /admin/products/:id/delete`)
- Delete button per product
- Confirmation modal popup with product name before deletion
- Cannot be accidentally triggered

### 4. Image Upload (Multer)
- Middleware: `multer` with `diskStorage`
- Uploaded files saved to `/public/uploads/<timestamp>-<random>.<ext>`
- File path stored as `uploads/filename.jpg` in MongoDB
- Accepted formats: JPG, PNG, WEBP, GIF
- Max file size: 5 MB
- Live image preview before submitting the form

### 5. Authentication
- Cookie-based auth via `cookie-parser`
- `requireAdmin` middleware checks `adminAuth` cookie on every `/admin` route
- Cookie expires after 8 hours
- Login/logout flow with redirect handling

---

## New Packages Added

| Package | Version | Purpose |
|---|---|---|
| `multer` | ^1.4.5-lts.1 | Multipart form / file upload handling |
| `cookie-parser` | ^1.4.6 | Reading cookies for admin authentication |

