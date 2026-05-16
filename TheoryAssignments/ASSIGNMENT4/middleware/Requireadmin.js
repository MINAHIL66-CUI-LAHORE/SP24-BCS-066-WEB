module.exports = function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return res.status(500).send('Server misconfiguration: ADMIN_SECRET missing.');
  }

  if (req.cookies?.adminAuth === secret) {
    return next();
  }

  res.redirect('/admin/login');
};