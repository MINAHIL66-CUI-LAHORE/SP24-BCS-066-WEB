// routes/sales.js
// ─────────────────────────────────────────────────────────────────────────────
// Two routes live here:
//
//   GET /sales            → server-renders views/sales.ejs (with admin layout)
//   GET /api/sales-data   → returns fresh JSON for the jQuery polling loop
//

const express  = require('express');
const router   = express.Router();
const Order    = require('../models/Order');
const Product  = require('../models/product');
const isAdmin  = require('../middleware/isAdmin');

// ── Shared helper – fetch all sales statistics from MongoDB ──────────────────
//
// Returns an object with:
//   totalRevenue      – sum of all non-cancelled order totals
//   totalOrders       – count of all orders
//   avgOrderValue     – totalRevenue / totalOrders  (0 when no orders)
//   topProducts       – top 5 products ranked by total units sold
//   recentOrders      – last 8 orders (newest first), items populated
//   categoryRevenue   – revenue broken down by product category
//   pendingOrders     – count of orders with status "pending"
//
async function fetchSalesStats() {

  // ── 1. Total revenue (exclude cancelled orders) ───────────────────────────
  const revenueResult = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  const totalRevenue = revenueResult[0]?.total ?? 0;

  // ── 2. Total order count ──────────────────────────────────────────────────
  const totalOrders = await Order.countDocuments({});

  // ── 3. Average order value ────────────────────────────────────────────────
  const avgOrderValue = totalOrders > 0
    ? parseFloat((totalRevenue / totalOrders).toFixed(2))
    : 0;

  // ── 4. Top-selling products (by units sold across all orders) ─────────────
  //    Unwind the items array so each line-item becomes its own document,
  //    then group by product ID and sum the quantities.
  const topProducts = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id:         '$items.product',
        productName: { $first: '$items.name' },
        unitsSold:   { $sum: '$items.quantity' },
        revenue:     { $sum: '$items.subtotal' },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 5 },
  ]);

  // ── 5. Revenue broken down by category ───────────────────────────────────
  const categoryRevenue = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id:     '$items.category',
        revenue: { $sum: '$items.subtotal' },
        units:   { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  // ── 6. Recent orders (last 8, newest first) ───────────────────────────────
  const recentOrders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  // ── 7. Pending order count ────────────────────────────────────────────────
  const pendingOrders = await Order.countDocuments({ status: 'pending' });

  return {
    totalRevenue:   parseFloat(totalRevenue.toFixed(2)),
    totalOrders,
    avgOrderValue,
    topProducts,
    categoryRevenue,
    recentOrders,
    pendingOrders,
    generatedAt: new Date().toISOString(),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// ROUTE 1 – GET /sales
// Server-side render the dashboard using express-ejs-layouts + views/sales.ejs
// ════════════════════════════════════════════════════════════════════════════
router.get('/', isAdmin, async (req, res) => {
  try {
    const stats = await fetchSalesStats();

    res.render('sales', {
      layout:  'layouts/admin',   // express-ejs-layouts: wrap in views/layouts/admin.ejs
      title:   'Sales Dashboard | Adidas Admin',

      // ── Pre-computed stats injected into the EJS template on first load ──
      totalRevenue:   stats.totalRevenue,
      totalOrders:    stats.totalOrders,
      avgOrderValue:  stats.avgOrderValue,
      topProducts:    stats.topProducts,
      categoryRevenue: stats.categoryRevenue,
      recentOrders:   stats.recentOrders,
      pendingOrders:  stats.pendingOrders,
      generatedAt:    stats.generatedAt,
    });
  } catch (err) {
    console.error('GET /sales error:', err);
    res.status(500).send('Server error loading sales dashboard.');
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ROUTE 2 – GET /api/sales-data
// Returns fresh statistics as JSON for the jQuery 10-second polling loop.
// No EJS rendering – pure JSON response.
// ════════════════════════════════════════════════════════════════════════════
router.get('/api/sales-data', isAdmin, async (req, res) => {
  try {
    const stats = await fetchSalesStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    console.error('GET /api/sales-data error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch sales data.' });
  }
});

module.exports = router;
