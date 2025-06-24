module.exports = function checkAdminAuth(req, res, next) {
  if (req.session && req.session.userId && req.session.role === 'admin') {
    next();
  } else {
    res.redirect('/login.html');
  }
};
