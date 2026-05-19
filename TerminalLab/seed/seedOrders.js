// seed/seedOrders.js


require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('../models/product');
const Order    = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/adidas';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  // ── Fetch real products from the DB ──────────────────────────────────────
  const products = await Product.find({}).lean();

  if (products.length === 0) {
    console.error('❌  No products found. Run your product seed first (npm run seed).');
    process.exit(1);
  }

  // ── Wipe existing orders ──────────────────────────────────────────────────
  await Order.deleteMany({});
  console.log('🗑  Cleared existing orders');

  // ── Build sample orders ───────────────────────────────────────────────────
  const statuses = ['delivered', 'delivered', 'delivered', 'shipped', 'processing', 'pending', 'cancelled'];

  function pickRandom(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  const ordersToInsert = [];

  // Generate 40 sample orders spread over the last 30 days
  for (let i = 0; i < 40; i++) {
    const numItems = Math.floor(Math.random() * 3) + 1;
    const pickedProducts = pickRandom(products, numItems);

    const items = pickedProducts.map(p => {
      const qty = Math.floor(Math.random() * 3) + 1;
      return {
        product:  p._id,
        name:     p.name,
        category: p.category,
        price:    p.price,
        quantity: qty,
        subtotal: parseFloat((p.price * qty).toFixed(2)),
      };
    });

    const total = parseFloat(items.reduce((s, it) => s + it.subtotal, 0).toFixed(2));

    // Spread orders over the past 30 days
    const daysAgo  = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const createdAt = new Date(Date.now() - (daysAgo * 86400 + hoursAgo * 3600) * 1000);

    ordersToInsert.push({
      items,
      total,
      status:    statuses[Math.floor(Math.random() * statuses.length)],
      createdAt,
      updatedAt: createdAt,
    });
  }

  // ── Insert using insertMany for speed ─────────────────────────────────────
  const inserted = await Order.insertMany(ordersToInsert);
  console.log(`✅  Inserted ${inserted.length} sample orders`);

  // ── Quick summary ─────────────────────────────────────────────────────────
  const totalRev = ordersToInsert
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total, 0);

  console.log(`💰  Approx. total revenue: $${totalRev.toFixed(2)}`);
  console.log('🏁  Seed complete – visit http://localhost:3000/sales');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
