const express      = require('express');
const path         = require('path');
const mongoose     = require('mongoose');
const cookieParser = require('cookie-parser');
const session      = require('express-session');
const MongoStore   = require('connect-mongo');
const flash        = require('connect-flash');
require('dotenv').config();
const app  = express();
const PORT = process.env.PORT || 3000;

// ── MongoDB connection ────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/adidas';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// ── View engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ── Session ───────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'adidas-secret-key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
}));

// ── Flash messages ────────────────────────────────────────────────────────────
app.use(flash());

// ── Global template variables ─────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId ? {
    id:   req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
  } : null;

  res.locals.query = req.query;

  next();
});

// ── Static home-page data ─────────────────────────────────────────────────────
const staticProducts = [
  {
    id: 1, badge: '-30%', badgeClass: '',
    image: 'Assets/Ultraboost_Football_Cleats_Black_JP7410_HM10.jpg',
    alt: 'Ultraboost 5', label: 'Running', name: 'Ultraboost 5',
    colors: ['#fff', '#000', '#c0392b'],
    salePrice: '$139.95', origPrice: '$199.95',
  },
  {
    id: 2, badge: null, feature: true,
    video: 'Assets/Stan_Smith_Lo_Pro_Shoes_Black_JR6010_video.webm',
    name: 'Stan Smith', label: 'Icon',
  },
  {
    id: 3, badge: 'New', badgeClass: 'product-card__badge--new',
    image: 'Assets/Predator_Elite_Firm_Ground_Soccer_Cleats_Red_JS0433_HM1.jpg',
    alt: 'Predator 24', label: 'Football', name: 'Predator 24 Pro',
    colors: ['#000', '#1a5c2b'], price: '$249.95',
  },
  {
    id: 4, badge: null,
    image: 'Assets/SUPERNOVA_RISE_3_RUNNING_SHOES_Blue_JR1613_HM1.jpg',
    alt: 'Supernova Rise', label: 'Running', name: 'Supernova Rise',
    colors: ['#000', '#2980b9', '#e74c3c'], price: '$119.95',
  },
];

const resources = [
  { image: 'Assets/ED_087_How_to_Clean_Shoes_mh_d_f0806a86f8.jpg',
    title: 'How To Clean Shoes', desc: 'Get down and dirty with adidas and learn how to clean your sneakers the right way.' },
  { image: 'Assets/edi_fw25_sambasizeguide_bnr_d_3_4126acc079.jpg',
    title: 'The adidas Samba Size Guide', desc: 'Tired of asking are Sambas true to size? Check out our official adidas Samba size guide.' },
  { image: 'Assets/Club_Tennis_Climacool_Pleated_Skirt_Kids_Black_JC6728_02_laydown_hover.jpg',
    title: 'Ace the Looks: How to Style a Tennis Skirt', desc: 'Are you ready to serve? Learn how to style a tennis skirt on and off the court.' },
  { image: 'Assets/LAFC_26-27_Home_Jersey_Black_JL6806_21_model.jpg',
    title: 'How To Style A Soccer Jersey', desc: 'From sporty to flirty to polished, the soccer jersey is a surprisingly versatile piece.' },
];

const categories = [
  { image: 'Assets/running.jpg',   label: 'Running' },
  { image: 'Assets/football.jpg',  label: 'Football' },
  { image: 'Assets/originals.jpg', label: 'Originals' },
  { image: 'Assets/training.jpg',  label: 'Training' },
  { image: 'Assets/women.jpg',     label: 'Women' },
];

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.render('index', {
    title:     'Adidas – Impossible Is Nothing',
    products:  staticProducts,
    resources,
    categories,
    error:   req.flash('error')[0] || null,
    success: req.flash('success')[0] || null,
  });
});

app.get('/men',   (req, res) => res.redirect('/products?category=Men'));
app.get('/women', (req, res) => res.redirect('/products?category=Women'));
app.get('/kids',  (req, res) => res.redirect('/products?category=Kids'));
app.get('/sport', (req, res) => res.redirect('/products?category=Training'));
app.get('/sale',  (req, res) => res.redirect('/products?maxPrice=99'));

const isLoggedIn = require('./middleware/Isloggedin');
app.get('/checkout', isLoggedIn, (req, res) => {
  res.render('checkout', { title: 'Checkout | Adidas' });
});

// ── Access Denied ─────────────────────────────────────────────────────────────
app.get('/access-denied', (req, res) => {
  res.status(403).render('403', {
    title:   'Access Denied | Adidas',
    message: 'You do not have permission to access this page.',
  });
});

app.use('/auth',     require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/admin',    require('./routes/admin'));

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found | Adidas' });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Adidas app running at http://localhost:${PORT}`);
  console.log(`    Admin panel at      http://localhost:${PORT}/admin`);
});