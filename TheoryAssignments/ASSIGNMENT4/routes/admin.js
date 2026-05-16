const express  = require('express');
const router   = express.Router();
const path     = require('path');
const multer   = require('multer');
const Product  = require('../models/product');

// ── Multer configuration ──────────────────────────────────────────────────────
// Files are saved to /public/uploads/<timestamp>-<originalname>
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext    = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase())
          && allowed.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error('Only image files are allowed (jpg, png, webp, gif).'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Simple session-less auth middleware ───────────────────────────────────────
// (assignment scope: password from .env; swap for express-session in production)
const requireAdmin = require('../middleware/requireAdmin');

// ── GET /admin – Dashboard (all products table) ───────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.render('admin/dashboard', {
      title: 'Admin Dashboard | Adidas',
      products,
      success: req.query.success || null,
      error:   req.query.error   || null,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('Server error loading admin dashboard.');
  }
});

// ── GET /admin/products/new – Show create form ────────────────────────────────
router.get('/products/new', requireAdmin, (req, res) => {
  res.render('admin/product-form', {
    title:   'Add New Product | Admin',
    product: null,      // null → create mode
    action:  '/admin/products',
    method:  'POST',
    error:   req.query.error || null,
  });
});

// ── POST /admin/products – Create product ─────────────────────────────────────
router.post('/products', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, rating, stock, badge, label } = req.body;

    // Server-side validation
    const errors = validateProduct({ name, price, category });
    if (errors.length) {
      return res.redirect(`/admin/products/new?error=${encodeURIComponent(errors[0])}`);
    }

    const imagePath = req.file ? `uploads/${req.file.filename}` : (req.body.imageUrl || '');

    await Product.create({
      name:     name.trim(),
      price:    parseFloat(price),
      category: category.trim(),
      rating:   parseFloat(rating) || 4,
      stock:    parseInt(stock)    || 0,
      badge:    badge?.trim()      || null,
      label:    label?.trim()      || '',
      image:    imagePath,
    });

    res.redirect('/admin?success=Product+created+successfully');
  } catch (err) {
    console.error('Create product error:', err);
    res.redirect(`/admin/products/new?error=${encodeURIComponent(err.message)}`);
  }
});

// ── GET /admin/products/:id/edit – Show edit form ─────────────────────────────
router.get('/products/:id/edit', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.redirect('/admin?error=Product+not+found');

    res.render('admin/product-form', {
      title:   `Edit ${product.name} | Admin`,
      product,
      action:  `/admin/products/${product._id}?_method=PUT`,
      method:  'POST',
      error:   req.query.error || null,
    });
  } catch (err) {
    res.redirect('/admin?error=Product+not+found');
  }
});

// ── POST /admin/products/:id?_method=PUT – Update product ────────────────────
// (method-override pattern: forms can't send PUT natively)
router.post('/products/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { _method, name, price, category, rating, stock, badge, label } = req.body;

    // Only proceed as update when ?_method=PUT
    if (_method !== 'PUT') return res.redirect('/admin');

    const errors = validateProduct({ name, price, category });
    if (errors.length) {
      return res.redirect(
        `/admin/products/${req.params.id}/edit?error=${encodeURIComponent(errors[0])}`
      );
    }

    const updates = {
      name:     name.trim(),
      price:    parseFloat(price),
      category: category.trim(),
      rating:   parseFloat(rating) || 4,
      stock:    parseInt(stock)    || 0,
      badge:    badge?.trim()      || null,
      label:    label?.trim()      || '',
    };

    // Only replace image if a new file was uploaded
    if (req.file) {
      updates.image = `uploads/${req.file.filename}`;
    }

    await Product.findByIdAndUpdate(req.params.id, updates, { runValidators: true });
    res.redirect('/admin?success=Product+updated+successfully');
  } catch (err) {
    console.error('Update product error:', err);
    res.redirect(
      `/admin/products/${req.params.id}/edit?error=${encodeURIComponent(err.message)}`
    );
  }
});

// ── POST /admin/products/:id/delete – Delete product ─────────────────────────
router.post('/products/:id/delete', requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin?success=Product+deleted+successfully');
  } catch (err) {
    console.error('Delete product error:', err);
    res.redirect(`/admin?error=${encodeURIComponent(err.message)}`);
  }
});

// ── GET /admin/login – Login page ─────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.cookies?.adminAuth === process.env.ADMIN_SECRET) {
    return res.redirect('/admin');
  }
  res.render('admin/login', {
    title: 'Admin Login | Adidas',
    error: req.query.error || null,
  });
});

// ── POST /admin/login – Authenticate ──────────────────────────────────────────
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_SECRET) {
    res.cookie('adminAuth', process.env.ADMIN_SECRET, {
      httpOnly: true,
      maxAge:   8 * 60 * 60 * 1000, // 8 hours
    });
    return res.redirect('/admin');
  }
  res.redirect('/admin/login?error=Invalid+password');
});

// ── GET /admin/logout ──────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  res.clearCookie('adminAuth');
  res.redirect('/admin/login');
});

// ── Helper: basic server-side validation ──────────────────────────────────────
function validateProduct({ name, price, category }) {
  const errors = [];
  if (!name?.trim())     errors.push('Product name is required.');
  if (!price || isNaN(price) || parseFloat(price) < 0)
                         errors.push('A valid price is required.');
  if (!category?.trim()) errors.push('Category is required.');
  return errors;
}

module.exports = router;