// routes/api.js
// ─────────────────────────────────────────────────────────────────────────────
// RESTful API – prefix: /api/v1
//
// PUBLIC  (no token required)
//   GET  /api/v1/products          – paginated + filtered product list
//   GET  /api/v1/products/:id      – single product
//   POST /api/v1/auth/login        – get a JWT token
//
// PROTECTED  (send "Authorization: Bearer <token>" header)
//   GET  /api/v1/user/profile      – authenticated user's data
//   POST /api/v1/orders            – place an order
// ─────────────────────────────────────────────────────────────────────────────

const router      = require('express').Router();
const jwt         = require('jsonwebtoken');
const bcrypt      = require('bcryptjs');
const Product     = require('../models/product');
const User        = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

// ════════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Returns a signed JWT on success.
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Basic validation ─────────────────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required.',
      });
    }

    // ── Find user ────────────────────────────────────────────────────────────
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // ── Check password ───────────────────────────────────────────────────────
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // ── Sign JWT ─────────────────────────────────────────────────────────────
    // Payload: user_id + role (as required by the spec)
    const payload = {
      user_id: user._id,
      role:    user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',   // token expires in 1 hour
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,            // client must store this and send it in Authorization header
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error('API login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// PRODUCTS  (public)
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/products
 * Query params (all optional):
 *   page      – page number, default 1
 *   limit     – items per page, default 10, max 50
 *   category  – filter by category string (case-insensitive)
 *   minPrice  – minimum price
 *   maxPrice  – maximum price
 *   search    – text search on name field
 *   sortBy    – field to sort by (price | name | rating | createdAt), default createdAt
 *   order     – asc | desc, default desc
 */
router.get('/products', async (req, res) => {
  try {
    // ── Pagination ───────────────────────────────────────────────────────────
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    // ── Build filter object ──────────────────────────────────────────────────
    const filter = {};

    if (req.query.category) {
      filter.category = { $regex: new RegExp(req.query.category, 'i') };
    }
    if (req.query.search) {
      filter.name = { $regex: new RegExp(req.query.search, 'i') };
    }
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // ── Sorting ──────────────────────────────────────────────────────────────
    const allowedSortFields = ['price', 'name', 'rating', 'createdAt'];
    const sortField = allowedSortFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    // ── Query ────────────────────────────────────────────────────────────────
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error('GET /api/v1/products error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/**
 * GET /api/v1/products/:id
 * Returns a single product by its MongoDB _id.
 */
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    // Invalid ObjectId format
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product ID format.' });
    }
    console.error('GET /api/v1/products/:id error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES  (all routes below require a valid JWT)
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/user/profile
 * Returns the authenticated user's profile data.
 * The verifyToken middleware attaches req.user = { user_id, role }
 */
router.get('/user/profile', verifyToken, async (req, res) => {
  try {
    // req.user.user_id comes from the JWT payload (set during login)
    const user = await User.findById(req.user.user_id)
      .select('-password')   // never send the hashed password
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('GET /api/v1/user/profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/**
 * POST /api/v1/orders
 * Body: { items: [{ productId, quantity }] }
 *
 * NOTE: Your project does not yet have an Order model, so this route
 * validates the request and returns a simulated confirmation response.
 * Replace the "TODO" block with real DB logic once you add an Order model.
 */
router.post('/orders', verifyToken, async (req, res) => {
  try {
    const { items } = req.body;

    // ── Basic validation ─────────────────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body must include a non-empty "items" array.',
      });
    }

    // Validate each item shape
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have a productId and a quantity >= 1.',
        });
      }
    }

    // ── Fetch products & calculate total ─────────────────────────────────────
    const productIds = items.map(i => i.productId);
    const products   = await Product.find({ _id: { $in: productIds } }).lean();

    // Make sure every requested product exists
    if (products.length !== items.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more product IDs were not found.',
      });
    }

    // Build line items with prices
    const lineItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        productId: product._id,
        name:      product.name,
        price:     product.price,
        quantity:  item.quantity,
        subtotal:  product.price * item.quantity,
      };
    });

    const total = lineItems.reduce((sum, li) => sum + li.subtotal, 0);

    // ── TODO: persist order to DB once you have an Order model ───────────────
    // const Order = require('../models/Order');
    // const order = await Order.create({
    //   user:      req.user.user_id,
    //   items:     lineItems,
    //   total,
    //   status:    'pending',
    // });

    // For now, return a simulated confirmation
    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order: {
        userId:    req.user.user_id,
        items:     lineItems,
        total:     parseFloat(total.toFixed(2)),
        status:    'pending',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('POST /api/v1/orders error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;