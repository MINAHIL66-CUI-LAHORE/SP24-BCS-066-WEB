/**
 * seed.js  –  run once to populate MongoDB
 * Usage:  node seed/seed.js
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product  = require('../models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/adidas';

const sampleProducts = [
  // ── Running (6) ─────────────────────────────────────────────
  {
    name: 'Ultraboost 5',        price: 139.95, category: 'Running',
    rating: 4.8, stock: 42, badge: '-30%',
    image: 'Assets/Ultraboost_Football_Cleats_Black_JP7410_HM10.jpg', label: 'Running',
  },
  {
    name: 'Supernova Rise 3',    price: 119.95, category: 'Running',
    rating: 4.5, stock: 30, badge: 'New',
    image: 'Assets/SUPERNOVA_RISE_3_RUNNING_SHOES_Blue_JR1613_HM1.jpg', label: 'Running',
  },
  {
    name: 'Adizero Evo SL Exo', price: 159.95, category: 'Running',
    rating: 4.7, stock: 18,
    image: 'Assets/ADIZERO_EVO_SL_EXO_Shoes_Black_KI4764_HM1.jpg', label: 'Running',
  },
  {
    name: 'Daily 4.0',           price:  79.95, category: 'Running',
    rating: 4.2, stock: 55,
    image: 'Assets/Daily_4.0_Shoes_Grey_IF4493_HM3_hover.jpg', label: 'Running',
  },
  {
    name: 'Rapidmove Go',        price:  89.95, category: 'Running',
    rating: 4.3, stock: 25,
    image: 'Assets/Rapidmove_Go_Training_Sneakers_White_JQ3934_HM3_hover.jpg', label: 'Running',
  },
  {
    name: 'Hyperboost Edge',     price: 179.95, category: 'Running',
    rating: 4.9, stock: 10, badge: 'New',
    image: 'Assets/adidas-hyperboost-edge-reflective-elements-24527355-main.jpg', label: 'Running',
  },

  // ── Football (5) ────────────────────────────────────────────
  {
    name: 'Predator 24 Pro',     price: 249.95, category: 'Football',
    rating: 4.8, stock: 15, badge: 'New',
    image: 'Assets/Predator_Elite_Firm_Ground_Soccer_Cleats_Red_JS0433_HM1.jpg', label: 'Football',
  },
  {
    name: 'Ultraboost Cleat',    price: 199.95, category: 'Football',
    rating: 4.6, stock: 20,
    image: 'Assets/Ultraboost_Football_Cleats_Black_JP7410_HM10.jpg', label: 'Football',
  },
  {
    name: 'Adizero Electric II', price: 219.95, category: 'Football',
    rating: 4.7, stock: 12, badge: '-15%',
    image: 'Assets/Adizero_Electric_II_Coins_Football_Cleats_Silver_JQ6768_04_standard.jpg', label: 'Football',
  },
  {
    name: 'LAFC 26-27 Jersey',   price:  89.95, category: 'Football',
    rating: 4.4, stock: 60,
    image: 'Assets/LAFC_26-27_Home_Jersey_Black_JL6806_21_model.jpg', label: 'Football',
  },
  {
    name: 'Predator League FG',  price: 149.95, category: 'Football',
    rating: 4.3, stock: 35,
    image: 'Assets/Predator_Elite_Firm_Ground_Soccer_Cleats_Red_JS0433_HM1.jpg', label: 'Football',
  },

  // ── Originals (5) ───────────────────────────────────────────
  {
    name: 'Stan Smith Lo Pro',   price:  99.95, category: 'Originals',
    rating: 4.6, stock: 80,
    image: 'Assets/Superstar_II_Shoes_Black_JI0079_01_standard.jpg', label: 'Originals',
  },
  {
    name: 'Superstar II',        price: 109.95, category: 'Originals',
    rating: 4.7, stock: 70, badge: 'Iconic',
    image: 'Assets/Superstar_II_Shoes_Black_JI0079_01_standard.jpg', label: 'Originals',
  },
  {
    name: 'Handball Spezial',    price: 119.95, category: 'Originals',
    rating: 4.9, stock: 45, badge: 'Hot',
    image: 'Assets/ultra-boost.jpg', label: 'Originals',
  },
  {
    name: 'Samba Classic',       price:  99.95, category: 'Originals',
    rating: 4.8, stock: 55,
    image: 'Assets/Superstar_II_Shoes_Black_JI0079_01_standard.jpg', label: 'Originals',
  },
  {
    name: 'Gazelle Bold',        price: 119.95, category: 'Originals',
    rating: 4.5, stock: 38, badge: 'New',
    image: 'Assets/originals.jpg', label: 'Originals',
  },

  // ── Training (5) ────────────────────────────────────────────
  {
    name: 'Dropset 4 Black',     price: 129.95, category: 'Training',
    rating: 4.5, stock: 28,
    image: 'Assets/Dropset_4_Training_Shoes_Black_JR4677_HM1.jpg', label: 'Training',
  },
  {
    name: 'Dropset 4 White',     price: 129.95, category: 'Training',
    rating: 4.4, stock: 22,
    image: 'Assets/Dropset_4_Training_Shoes_Black_JR4679_HM1.jpg', label: 'Training',
  },
  {
    name: 'Dropset 4 Grey',      price: 124.95, category: 'Training',
    rating: 4.3, stock: 19, badge: '-10%',
    image: 'Assets/Dropset_4_Training_Shoes_Grey_JR4674_HM1.jpg', label: 'Training',
  },
  {
    name: 'Rapidmove Trainer',   price:  99.95, category: 'Training',
    rating: 4.2, stock: 40,
    image: 'Assets/sport3.jpg', label: 'Training',
  },
  {
    name: 'Powerlift 5',         price: 119.95, category: 'Training',
    rating: 4.6, stock: 15, badge: 'New',
    image: 'Assets/sport2.jpg', label: 'Training',
  },

  // ── Women (5) ───────────────────────────────────────────────
  {
    name: 'Tennis Climacool Skirt', price: 59.95, category: 'Women',
    rating: 4.5, stock: 50,
    image: 'Assets/Club_Tennis_Climacool_Pleated_Skirt_Kids_Black_JC6728_02_laydown_hover.jpg', label: 'Women',
  },
  {
    name: 'Ultraboost 5 W',      price: 139.95, category: 'Women',
    rating: 4.8, stock: 33, badge: 'New',
    image: 'Assets/SUPERNOVA_RISE_3_RUNNING_SHOES_Blue_JR1613_HM1.jpg', label: 'Women',
  },
  {
    name: 'Daily 4.0 W',         price:  79.95, category: 'Women',
    rating: 4.3, stock: 44,
    image: 'Assets/Daily_4.0_Shoes_Grey_IF4493_HM3_hover.jpg', label: 'Women',
  },
  {
    name: 'Supernova W',         price: 109.95, category: 'Women',
    rating: 4.4, stock: 27,
    image: 'Assets/women.jpg', label: 'Women',
  },
  {
    name: 'Stan Smith W',        price:  99.95, category: 'Women',
    rating: 4.7, stock: 62, badge: 'Iconic',
    image: 'Assets/Superstar_II_Shoes_Black_JI0079_01_standard.jpg', label: 'Women',
  },

  // ── Kids (4) ────────────────────────────────────────────────
  {
    name: 'Adizero Jr Cleat',    price:  79.95, category: 'Kids',
    rating: 4.4, stock: 30,
    image: 'Assets/kid1.jpg', label: 'Kids',
  },
  {
    name: 'Predator Jr',         price:  89.95, category: 'Kids',
    rating: 4.3, stock: 24,
    image: 'Assets/kid2.jpg', label: 'Kids',
  },
  {
    name: 'Supernova Jr',        price:  69.95, category: 'Kids',
    rating: 4.2, stock: 38, badge: '-20%',
    image: 'Assets/kid3.jpg', label: 'Kids',
  },
  {
    name: 'Daily 4.0 Jr',        price:  59.95, category: 'Kids',
    rating: 4.1, stock: 50,
    image: 'Assets/kid4.jpg', label: 'Kids',
  },
  // ── Men (4) ─────────────────────────────────────────────────
{
  name: 'Ultraboost 5 Men',
  price: 149.95, category: 'Men',
  rating: 4.8, stock: 30, badge: 'New',
  image: 'Assets/adidas_x_Someone_Somewhere_Gazelle_Shoes_Black_HQ9441_HM1.jpg',
  label: 'Men',
},
{
  name: 'Predator Men',
  price: 199.95, category: 'Men',
  rating: 4.6, stock: 20,
  image: 'Assets/ANTHONY_EDWARDS_2_Shoes_Blue_JQ9501_01_00_standard.jpg',
  label: 'Men',
},
{
  name: 'Samba Men',
  price: 99.95, category: 'Men',
  rating: 4.7, stock: 45, badge: '-10%',
  image: 'Assets/Samba_OG_Shoes_White_B75806_01_00_standard.jpg',
  label: 'Men',
},
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    await Product.deleteMany({});
    console.log('🗑  Cleared existing products');

    const inserted = await Product.insertMany(sampleProducts);
    console.log(`🌱 Seeded ${inserted.length} products`);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

seed();