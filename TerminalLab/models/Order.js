// models/Order.js

const mongoose = require('mongoose');

// ── Line-item sub-schema ──────────────────────────────────────────────────────
const lineItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String,  required: true },   // snapshot at time of purchase
  category: { type: String,  default: '' },       // snapshot – useful for category revenue
  price:    { type: Number,  required: true },    // unit price at time of purchase
  quantity: { type: Number,  required: true, min: 1 },
  subtotal: { type: Number,  required: true },    // price × quantity
}, { _id: false });

// ── Order schema ──────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
    default: null,   // null = guest checkout
  },
  items: {
    type:     [lineItemSchema],
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message:   'An order must contain at least one item.',
    },
  },
  total:  { type: Number, required: true, min: 0 },   // sum of all subtotals
  status: {
    type:    String,
    enum:    ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: true });   // createdAt + updatedAt added automatically

// ── Indexes for dashboard queries ─────────────────────────────────────────────
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
