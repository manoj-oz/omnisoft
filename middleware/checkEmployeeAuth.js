module.exports = function checkEmployeeAuth(req, res, next) {
  if (req.session && req.session.userId && req.session.role === 'employee') {
    next();
  } else {
    res.redirect('/login.html');
  }
};
