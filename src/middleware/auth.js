function requireAuth(req, res, next) {
    if (!req.session?.user) {
      return res.redirect("/login.html");
    }
    next();
  }
  
  module.exports = { requireAuth };