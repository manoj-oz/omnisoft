module.exports = function checkSuperAdminAuth(req, res, next) {
  if (req.session && req.session.userId && req.session.role === 'superadmin') {
    next();
  } else {
    res.redirect('/superAdminLogin.html');
  }
};
