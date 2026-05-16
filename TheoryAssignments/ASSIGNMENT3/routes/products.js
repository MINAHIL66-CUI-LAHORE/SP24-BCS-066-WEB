const express = require('express');
const router  = require('express').Router();
const Product = require('../models/Product');

const PAGE_SIZE = 8;

const ALL_CATEGORIES = ['Running', 'Football', 'Originals', 'Training', 'Women', 'Kids'];

// GET /products
router.get('/', async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page) || 1);
    const search   = (req.query.search   || '').trim();
    const category = (req.query.category || '').trim();
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || 99999;
    const sortBy   = req.query.sortBy || 'default';

    // ── Build filter ──────────────────────────────────────────
    const filter = {};

    if (search) {
  const exactSearch = `\\b${search}\\b`;
  filter.$or = [
    { name:     { $regex: exactSearch, $options: 'i' } },
    { category: { $regex: exactSearch, $options: 'i' } },
    { label:    { $regex: exactSearch, $options: 'i' } },
  ];
}

    if (category) filter.category = category;
    filter.price = { $gte: minPrice, $lte: maxPrice };

    // ── Build sort ────────────────────────────────────────────
    let sort = {};
    if (sortBy === 'price-asc')       sort = { price:  1 };
    else if (sortBy === 'price-desc') sort = { price: -1 };
    else if (sortBy === 'rating')     sort = { rating: -1 };
    else if (sortBy === 'name')       sort = { name:   1 };

    // ── Pagination ────────────────────────────────────────────
    const totalProducts = await Product.countDocuments(filter);
    const totalPages    = Math.ceil(totalProducts / PAGE_SIZE) || 1;
    const currentPage   = Math.min(page, totalPages);
    const skip          = (currentPage - 1) * PAGE_SIZE;

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean();

    const pageNums = buildPageNums(currentPage, totalPages);

    res.render('products', {
      title:      'Product Catalog | Adidas',
      products,
      categories: ALL_CATEGORIES,
      currentPage,
      totalPages,
      totalProducts,
      pageNums,
      filters: {
        search,
        category,
        minPrice: minPrice || '',
        maxPrice: maxPrice >= 99999 ? '' : maxPrice,
        sortBy,
      },
    });
  } catch (err) {
    console.error('Products route error:', err);
    res.status(500).send('Server error – check MongoDB connection.');
  }
});

// GET /products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).render('404', { title: 'Not Found | Adidas' });
    res.render('product-detail', { title: `${product.name} | Adidas`, product });
  } catch (err) {
    res.status(404).render('404', { title: 'Not Found | Adidas' });
  }
});

function buildPageNums(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current]);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(null);
    result.push(sorted[i]);
  }
  return result;
}

module.exports = router;