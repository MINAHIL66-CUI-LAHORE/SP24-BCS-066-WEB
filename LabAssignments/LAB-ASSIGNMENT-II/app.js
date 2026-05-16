const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── View engine ──────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static files (CSS, images, videos) ───────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Data (would normally come from a DB / API) ────────────────
const products = [
  {
    id: 1,
    badge: '-30%',
    badgeClass: '',
    image: 'Assets/Ultraboost_Football_Cleats_Black_JP7410_HM10.jpg',
    alt: 'Ultraboost 5',
    label: 'Running',
    name: 'Ultraboost 5',
    colors: ['#fff', '#000', '#c0392b'],
    salePrice: '$139.95',
    origPrice: '$199.95',
  },
  {
    id: 2,
    badge: null,
    feature: true,               // renders as video overlay card
    video: 'Assets/Stan_Smith_Lo_Pro_Shoes_Black_JR6010_video.webm',
    name: 'Stan Smith',
    label: 'Icon',
  },
  {
    id: 3,
    badge: 'New',
    badgeClass: 'product-card__badge--new',
    image: 'Assets/Predator_Elite_Firm_Ground_Soccer_Cleats_Red_JS0433_HM1.jpg',
    alt: 'Predator 24',
    label: 'Football',
    name: 'Predator 24 Pro',
    colors: ['#000', '#1a5c2b'],
    price: '$249.95',
  },
  {
    id: 4,
    badge: null,
    image: 'Assets/SUPERNOVA_RISE_3_RUNNING_SHOES_Blue_JR1613_HM1.jpg',
    alt: 'Supernova Rise',
    label: 'Running',
    name: 'Supernova Rise',
    colors: ['#000', '#2980b9', '#e74c3c'],
    price: '$119.95',
  },
];

const resources = [
  {
    image: 'Assets/ED_087_How_to_Clean_Shoes_mh_d_f0806a86f8.jpg',
    title: 'How To Clean Shoes',
    desc:  'Get down and dirty with adidas and learn how to clean your sneakers the right way.',
  },
  {
    image: 'Assets/edi_fw25_sambasizeguide_bnr_d_3_4126acc079.jpg',
    title: 'The adidas Samba Size Guide',
    desc:  'Tired of asking are Sambas true to size? Check out our official adidas Samba size guide.',
  },
  {
    image: 'Assets/Club_Tennis_Climacool_Pleated_Skirt_Kids_Black_JC6728_02_laydown_hover.jpg',
    title: 'Ace the Looks: How to Style a Tennis Skirt',
    desc:  'Are you ready to serve? Learn how to style a tennis skirt on and off the court.',
  },
  {
    image: 'Assets/LAFC_26-27_Home_Jersey_Black_JL6806_21_model.jpg',
    title: 'How To Style A Soccer Jersey',
    desc:  'From sporty to flirty to polished, the soccer jersey is a surprisingly versatile piece.',
  },
];

const categories = [
  { image: 'Assets/running.jpg',   label: 'Running'   },
  { image: 'Assets/football.jpg',  label: 'Football'  },
  { image: 'Assets/originals.jpg', label: 'Originals' },
  { image: 'Assets/training.jpg',  label: 'Training'  },
  { image: 'Assets/women.jpg',     label: 'Women'     },
];

// ── Routes ────────────────────────────────────────────────────

// Home page
app.get('/', (req, res) => {
  res.render('index', {
    title:      'Adidas – Impossible Is Nothing',
    products,
    resources,
    categories,
  });
});

// Products listing (bonus route)
app.get('/products', (req, res) => {
  res.render('products', {
    title:    'Best Sellers | Adidas',
    products,
  });
});

// Single product (bonus route)
app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).render('404', { title: 'Not Found' });
  res.render('product-detail', { title: `${product.name} | Adidas`, product });
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found | Adidas' });
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Adidas app running at http://localhost:${PORT}`);
});
