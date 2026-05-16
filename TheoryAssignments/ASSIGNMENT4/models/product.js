const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  category: { type: String, required: true },   // e.g. 'Running', 'Football', 'Originals', 'Training', 'Women'
  rating:   { type: Number, min: 0, max: 5, default: 4 },
  stock:    { type: Number, default: 0 },
  image:    { type: String, default: '' },
  badge:    { type: String, default: null },     // e.g. '-30%', 'New', or null
  label:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);