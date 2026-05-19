const express = require('express');
const router  = require('express').Router();
const User    = require('../models/User');

// ── GET /auth/register ───────────────────────────────────────────────────────
router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/register', {
    title:     'Register | Adidas',
    error:     req.flash('error')[0]     || null,
    success:   req.flash('success')[0]   || null,
    formName:  req.flash('formName')[0]  || '',
    formEmail: req.flash('formEmail')[0] || '',
  });
});

// ── POST /auth/register ──────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      req.flash('formName', name);
      req.flash('formEmail', email);
      return req.session.save(() => res.redirect('/auth/register'));
    }

    const existing = await User.findOne({ email });
    if (existing) {
      req.flash('error', 'An account with that email already exists.');
      req.flash('formName', name);
      req.flash('formEmail', email);
      return req.session.save(() => res.redirect('/auth/register'));
    }

    const user = await User.create({ name, email, password });

    req.flash('success', `Account created successfully! Welcome, ${user.name}. Please sign in.`);
    return req.session.save(() => res.redirect('/auth/register'));

  } catch (err) {
    if (err.code === 11000) {
      req.flash('error', 'An account with that email already exists.');
    } else {
      req.flash('error', err.message || 'Registration failed. Please try again.');
    }
    return req.session.save(() => res.redirect('/auth/register'));
  }
});

// ── GET /auth/login ──────────────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/login', {
    title:   'Login | Adidas',
    error:   req.flash('error')[0]   || null,
    success: req.flash('success')[0] || null,
  });
});

// ── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid username or password.');
      return req.session.save(() => res.redirect('/auth/login'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid username or password.');
      return req.session.save(() => res.redirect('/auth/login'));
    }

    req.session.userId   = user._id;
    req.session.userName = user.name;
    req.session.userRole = user.role;

    req.flash('success', `Welcome back, ${user.name}!`);
    return req.session.save(() => res.redirect('/'));

  } catch (err) {
    req.flash('error', 'Login failed. Please try again.');
    return req.session.save(() => res.redirect('/auth/login'));
  }
});

// ── GET /auth/logout ─────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Session destroy error:', err);
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;