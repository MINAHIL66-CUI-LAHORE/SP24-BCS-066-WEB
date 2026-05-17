const express  = require('express');
const router   = express.Router();
const path     = require('path');
const multer   = require('multer');
const Product  = require('../models/product');
const isAdmin  = require('../middleware/isAdmin');

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const ok = /jpeg|jpg|png|webp|gif/.test(path.extname(file.originalname).toLowerCase())
          && /jpeg|jpg|png|webp|gif/.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error('Only image files are allowed.'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── PUBLIC: Admin login ───────────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session?.userRole === 'admin') return res.redirect('/admin');
  res.render('admin/login', {
    title: 'Admin Login | Adidas',
    error: req.flash('error')[0] || null,
  });
});

router.post('/login', (req, res) => {
  const { password } = req.body;
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return res.status(500).send('ADMIN_SECRET not set.');
  if (password === secret) {
    req.session.userId   = 'admin';
    req.session.userName = 'Admin';
    req.session.userRole = 'admin';
    return req.session.save(() => res.redirect('/admin'));
  }
  req.flash('error', 'Invalid password.');
  return req.session.save(() => res.redirect('/admin/login'));
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ── PROTECTED ─────────────────────────────────────────────────────────────────
router.get('/', isAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.render('admin/dashboard', {
      title:   'Admin Dashboard | Adidas',
      products,
      success: req.flash('success')[0] || null,
      error:   req.flash('error')[0]   || null,
    });
  } catch (err) {
    res.status(500).send('Server error loading admin dashboard.');
  }
});

router.get('/products/new', isAdmin, (req, res) => {
  res.render('admin/product-form', {
    title: 'Add New Product | Admin', product: null,
    action: '/admin/products', method: 'POST', error: null,
  });
});

router.post('/products', isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, rating, stock, badge, label } = req.body;
    const errors = validateProduct({ name, price, category });
    if (errors.length) return res.redirect(`/admin/products/new?error=${encodeURIComponent(errors[0])}`);
    const imagePath = req.file ? `uploads/${req.file.filename}` : (req.body.imageUrl || '');
    await Product.create({
      name: name.trim(), price: parseFloat(price), category: category.trim(),
      rating: parseFloat(rating) || 4, stock: parseInt(stock) || 0,
      badge: badge?.trim() || null, label: label?.trim() || '', image: imagePath,
    });
    req.flash('success', 'Product created successfully.');
    res.redirect('/admin');
  } catch (err) {
    res.redirect(`/admin/products/new?error=${encodeURIComponent(err.message)}`);
  }
});

router.get('/products/:id/edit', isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.redirect('/admin?error=Product+not+found');
    res.render('admin/product-form', {
      title: `Edit ${product.name} | Admin`, product,
      action: `/admin/products/${product._id}?_method=PUT`, method: 'POST', error: null,
    });
  } catch (err) {
    res.redirect('/admin?error=Product+not+found');
  }
});

router.post('/products/:id', isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { _method, name, price, category, rating, stock, badge, label } = req.body;
    if (_method !== 'PUT') return res.redirect('/admin');
    const errors = validateProduct({ name, price, category });
    if (errors.length) return res.redirect(`/admin/products/${req.params.id}/edit?error=${encodeURIComponent(errors[0])}`);
    const updates = {
      name: name.trim(), price: parseFloat(price), category: category.trim(),
      rating: parseFloat(rating) || 4, stock: parseInt(stock) || 0,
      badge: badge?.trim() || null, label: label?.trim() || '',
    };
    if (req.file) updates.image = `uploads/${req.file.filename}`;
    await Product.findByIdAndUpdate(req.params.id, updates, { runValidators: true });
    req.flash('success', 'Product updated successfully.');
    res.redirect('/admin');
  } catch (err) {
    res.redirect(`/admin/products/${req.params.id}/edit?error=${encodeURIComponent(err.message)}`);
  }
});

router.post('/products/:id/delete', isAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.flash('success', 'Product deleted successfully.');
    res.redirect('/admin');
  } catch (err) {
    res.redirect(`/admin?error=${encodeURIComponent(err.message)}`);
  }
});

function validateProduct({ name, price, category }) {
  const errors = [];
  if (!name?.trim())                                    errors.push('Product name is required.');
  if (!price || isNaN(price) || parseFloat(price) < 0) errors.push('A valid price is required.');
  if (!category?.trim())                                errors.push('Category is required.');
  return errors;
}

module.exports = router;