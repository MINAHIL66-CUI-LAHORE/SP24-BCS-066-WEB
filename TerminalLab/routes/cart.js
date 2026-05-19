// routes/cart.js
// ─────────────────────────────────────────────────────────────────────────────
// Cart stored in the session (req.session.cart).
// Structure:  { items: [ { productId, name, category, price, image, quantity } ] }
//
// Routes:
//   POST /cart/add          → add product to session cart
//   GET  /cart              → view cart page
//   POST /cart/remove       → remove one item from cart
//   POST /cart/update       → update quantity
//   POST /cart/place-order  → convert cart into an Order document
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const Product = require('../models/product');
const Order   = require('../models/Order');

// ── Helper: get or initialise the cart from session ──────────────────────────
function getCart(req) {
  if (!req.session.cart) {
    req.session.cart = { items: [] };
  }
  return req.session.cart;
}

// ── Helper: calculate cart total ─────────────────────────────────────────────
function cartTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ════════════════════════════════════════════════════════════════════════════
// POST /cart/add
// Body: { productId, quantity (optional, default 1) }
// ════════════════════════════════════════════════════════════════════════════
router.post('/add', async (req, res) => {
  try {
    const { productId } = req.body;
    const qty = Math.max(1, parseInt(req.body.quantity) || 1);

    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.redirect('/products?error=Product+not+found');
    }

    const cart = getCart(req);

    // Check if already in cart — increment quantity
    const existing = cart.items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.items.push({
        productId: String(product._id),
        name:      product.name,
        category:  product.category,
        price:     product.price,
        image:     product.image || '',
        quantity:  qty,
      });
    }

    req.session.cart = cart;

    // Redirect back to wherever the user was (product page or products list)
    const referer = req.get('Referer') || '/products';
    res.redirect(referer + (referer.includes('?') ? '&' : '?') + 'added=1');
  } catch (err) {
    console.error('POST /cart/add error:', err);
    res.redirect('/products?error=Could+not+add+to+cart');
  }
});

// ════════════════════════════════════════════════════════════════════════════
// GET /cart
// Render the cart page
// ════════════════════════════════════════════════════════════════════════════
router.get('/', (req, res) => {
  const cart  = getCart(req);
  const total = cartTotal(cart.items);

  res.render('cart', {
    title:   'Your Cart | Adidas',
    items:   cart.items,
    total:   total.toFixed(2),
    success: req.query.success || null,
    error:   req.query.error   || null,
  });
});

// ════════════════════════════════════════════════════════════════════════════
// POST /cart/remove
// Body: { productId }
// ════════════════════════════════════════════════════════════════════════════
router.post('/remove', (req, res) => {
  const { productId } = req.body;
  const cart = getCart(req);
  cart.items = cart.items.filter(i => i.productId !== productId);
  req.session.cart = cart;
  res.redirect('/cart');
});

// ════════════════════════════════════════════════════════════════════════════
// POST /cart/update
// Body: { productId, quantity }
// ════════════════════════════════════════════════════════════════════════════
router.post('/update', (req, res) => {
  const { productId } = req.body;
  const qty = parseInt(req.body.quantity);
  const cart = getCart(req);

  const item = cart.items.find(i => i.productId === productId);
  if (item) {
    if (qty < 1) {
      cart.items = cart.items.filter(i => i.productId !== productId);
    } else {
      item.quantity = qty;
    }
  }
  req.session.cart = cart;
  res.redirect('/cart');
});

// ════════════════════════════════════════════════════════════════════════════
// POST /cart/place-order
// Converts the session cart into an Order document in MongoDB.
// No payment processing — for demo/lab purposes only.
// ════════════════════════════════════════════════════════════════════════════
router.post('/place-order', async (req, res) => {
  try {
    const cart = getCart(req);

    if (!cart.items || cart.items.length === 0) {
      return res.redirect('/cart?error=Your+cart+is+empty');
    }

    const orderItems = cart.items.map(item => ({
      product:  item.productId,
      name:     item.name,
      category: item.category,
      price:    item.price,
      quantity: item.quantity,
      subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
    }));

    const total = parseFloat(cartTotal(cart.items).toFixed(2));

    const order = new Order({
      user:   req.session.userId || null,
      items:  orderItems,
      total,
      status: 'pending',
    });

    await order.save();

    // Clear the cart after placing the order
    req.session.cart = { items: [] };

    res.redirect('/cart?success=Order+placed+successfully!+Order+ID:+' + order._id);
  } catch (err) {
    console.error('POST /cart/place-order error:', err);
    res.redirect('/cart?error=Could+not+place+order.+Please+try+again.');
  }
});

module.exports = router;
