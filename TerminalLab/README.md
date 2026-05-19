# Final Lab – Sales Dashboard 
### SP24-BCS-066 | Web Technologies

---

## Overview

This is the complete Adidas e-commerce application built across multiple labs. It includes:

- **EJS-based storefront** with product catalog, filtering, and pagination
- **Session-based authentication** (register / login / logout)
- **Admin panel** for managing products
- **Sales Dashboard** with real-time jQuery polling (this lab's main feature)
- **Session-based shopping cart** with order placement
- **RESTful JSON API** under `/api/v1` with JWT authentication

---

## How to Run

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your `.env` file
```
MONGO_URI=mongodb://127.0.0.1:27017/adidas
PORT=3000
ADMIN_SECRET=adidas@admin123
SESSION_SECRET=adidas-super-secret-session-key-change-me
JWT_SECRET=adidas-jwt-super-secret-key-change-in-production-2024
```

### 3. Seed the database (first time only)
```bash
node seed/seed.js        # seeds Products
node seed/seedOrders.js  # seeds Orders (needed for Sales Dashboard)
```

### 4. Start the server
```bash
npm run dev
```

Server runs at → `http://localhost:3000`

---

## Project File Structure

```
final-lab/
├── .env
├── app.js
├── package.json
│
├── middleware/
│   ├── isadmin
│   ├── Isloggedin
│   ├── Requireadmin.js
│   └── verifyToken.js
│
├── models/
│   ├── User.js
│   ├── product.js
│   └── Order.js                  ← tracks all purchases
│
├── routes/
│   ├── admin.js
│   ├── auth.js
│   ├── products.js
│   ├── sales.js                  ← Sales Dashboard + /api/sales-data
│   ├── cart.js                   ← Session cart + order placement
│   └── api.js                    ← RESTful API (JWT)
│
├── views/
│   ├── index.ejs
│   ├── products.ejs
│   ├── product-detail.ejs        ← Add to Cart form
│   ├── cart.ejs                  ← Cart page
│   ├── sales.ejs                 ← Sales Dashboard (with jQuery polling)
│   ├── layouts/
│   │   └── admin.ejs             ← Master layout for admin/sales pages
│   ├── partials/
│   │   ├── header.ejs            ← Dynamic cart count badge
│   │   ├── footer.ejs
│   │   ├── product-card.ejs
│   │   └── admin-sidebar.ejs
│   └── admin/
│       ├── dashboard.ejs
│       ├── login.ejs
│       └── product-form.ejs
│
├── public/
│   ├── style.css
│   ├── catalog.css
│   ├── admin.css
│   └── Assets/
│
└── seed/
    ├── seed.js
    └── seedOrders.js
```

---

## How to Test Everything

### ── Browser Testing (Manual) ──────────────────────────────────────────

#### 1. Home & Products
| What to do | URL |
|---|---|
| Visit homepage | `http://localhost:3000/` |
| Browse products | `http://localhost:3000/products` |
| Filter by category | `http://localhost:3000/products?category=Running` |
| Search | `http://localhost:3000/products?search=samba` |
| Product detail | Click any product card |

#### 2. Auth (Register / Login)
| What to do | URL |
|---|---|
| Register a new account | `http://localhost:3000/auth/register` |
| Login | `http://localhost:3000/auth/login` |
| Logout | `http://localhost:3000/auth/logout` |

Use these test credentials if already seeded:
```
Email:    mini@gmail.com
Password: YourPassword1!
```

#### 3. Shopping Cart
| What to do | Steps |
|---|---|
| Add item to cart | Go to any product → click **Add to Cart** |
| View cart | Click bag icon in nav OR go to `/cart` |
| Update quantity | Change the number in the qty box (auto-submits) |
| Remove item | Click the ✕ button next to an item |
| Place order | Click **Place Order** in the cart summary |

> After placing an order, it gets saved to MongoDB and appears in the Sales Dashboard.

#### 4. Sales Dashboard  (Main Lab Feature)
| What to do | Steps |
|---|---|
| Login as admin first | `http://localhost:3000/admin` → use `ADMIN_SECRET` from `.env` |
| Open Sales Dashboard | `http://localhost:3000/sales` |
| Watch live updates | Leave the page open — stats refresh **every 10 seconds** automatically |
| Trigger a live change | Open another tab → place an order via cart → switch back and watch the numbers update |
| Verify polling works | Open browser DevTools → **Network tab** → filter by `Fetch/XHR` → you should see a `GET /api/sales-data` request firing every 10 seconds |

The dashboard shows:
- **Total Revenue** – sum of all non-cancelled orders
- **Total Orders** – count of all orders in the DB
- **Avg Order Value** – revenue ÷ orders
- **Pending Orders** – orders with status = pending
- **Top 5 Products** – by units sold
- **Revenue by Category** – bar chart
- **Recent 8 Orders** – live table with status badges

#### 5. Admin Panel
| What to do | URL |
|---|---|
| Admin login | `http://localhost:3000/admin` |
| View products | `http://localhost:3000/admin` (dashboard) |
| Add a product | `http://localhost:3000/admin/products/new` |
| Edit a product | Click Edit on any product row |
| Delete a product | Click Delete on any product row |

---

### ── API Testing (Postman / Thunder Client) ─────────────────────────────

Base URL: `http://localhost:3000/api/v1`

#### Step 1 — Get all products (no token needed)
```
GET http://localhost:3000/api/v1/products
```
Optional query params:
```
?category=Running&page=1&limit=5&sortBy=price&order=asc
```

#### Step 2 — Get single product
```
GET http://localhost:3000/api/v1/products/<product_id>
```

#### Step 3 — Login to get JWT token
```
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "mini@gmail.com",
  "password": "YourPassword1!"
}
```
Copy the `token` from the response — you need it for the next two requests.

#### Step 4 — Get your profile (token required)
```
GET http://localhost:3000/api/v1/user/profile
Authorization: Bearer <paste_token_here>
```

#### Step 5 — Place an order via API (token required)
```
POST http://localhost:3000/api/v1/orders
Authorization: Bearer <paste_token_here>
Content-Type: application/json

{
  "items": [
    { "productId": "<any_valid_product_id>", "quantity": 2 }
  ]
}
```
> After this, check the Sales Dashboard — the new order will appear within 10 seconds.

#### Step 6 — Test the live polling API endpoint directly
```
GET http://localhost:3000/api/sales-data
```
> This is the exact endpoint jQuery hits every 10 seconds on the Sales Dashboard.
> Returns JSON with totalRevenue, totalOrders, avgOrderValue, topProducts, etc.

---

### ── Verifying the 10-Second Polling ──────────────────────────────────

1. Open `http://localhost:3000/sales` in your browser
2. Open **DevTools** → **Network** tab → check **Fetch/XHR**
3. You will see `sales-data` requests appearing automatically every 10 seconds
4. The countdown timer on the page also ticks from 10 → 0 → 10
5. To see a live DOM change:
   - Note the current **Total Orders** number on the dashboard
   - Open a new tab → go to `/cart` → add a product → place an order
   - Switch back to the dashboard → within 10 seconds the number updates

---

## API Endpoints Reference

### Public (No Token Required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/products` | All products (paginated + filtered) |
| `GET` | `/api/v1/products/:id` | Single product by ID |
| `POST` | `/api/v1/auth/login` | Login → receive JWT |

### Protected (JWT Required in Authorization header)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/user/profile` | Authenticated user's profile |
| `POST` | `/api/v1/orders` | Place an order |

### Sales Dashboard Internal

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/sales` | Renders the Sales Dashboard (admin only) |
| `GET` | `/api/sales-data` | Live JSON stats (polled by jQuery every 10s) |

---

## JWT Implementation

```
1. POST /api/v1/auth/login  →  server verifies email + password
2. Server signs JWT with { user_id, role }  →  expires in 1 hour
3. Client stores token and sends it as:
       Authorization: Bearer <token>
4. verifyToken middleware validates on every protected route
5. Decoded payload available as req.user inside route handlers
```

### Token Payload
```json
{
  "user_id": "6a09ab8a01d105803fd42fda",
  "role": "customer",
  "iat": 1779047211,
  "exp": 1779050811
}
```

### Error Responses
| Scenario | Status | Message |
|---|---|---|
| No token | `401` | Access denied. No token provided. |
| Invalid / expired token | `403` | Invalid or expired token. |
| Wrong credentials | `401` | Invalid credentials. |

---

## Files Added / Modified in This Lab

### New Files
| File | Purpose |
|---|---|
| `models/Order.js` | Order schema — items, total, status, timestamps |
| `routes/sales.js` | `GET /sales` (EJS render) + `GET /api/sales-data` (JSON) |
| `routes/cart.js` | Session cart — add, view, update, remove, place-order |
| `views/sales.ejs` | Sales Dashboard with KPI cards + jQuery polling script |
| `views/cart.ejs` | Shopping cart page |
| `views/layouts/admin.ejs` | Master layout wrapping sales dashboard (loads jQuery CDN) |
| `seed/seedOrders.js` | Seeds sample orders so the dashboard has data |

### Modified Files
| File | Change |
|---|---|
| `app.js` | Added cart route + `res.locals.cartCount` for live nav badge |
| `views/partials/header.ejs` | Cart icon now links to `/cart` with dynamic item count badge |
| `views/product-detail.ejs` | Add to Cart button is now a real working form |
| `views/partials/admin-sidebar.ejs` | Added Sales Dashboard link |

---

## Screenshots

### Login
![Login](screenshots/login.png)

### Products
![Products](screenshots/products.png)

### User Profile (API)
![Profile](screenshots/profile.png)

### Place Order (API)
![Orders](screenshots/orders.png)