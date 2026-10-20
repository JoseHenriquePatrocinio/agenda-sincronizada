function requireAdmin(req, res, next) {
    if (!req.session?.user) {
      return res.status(401).json({
        error: "Autenticação necessária.",
      });
    }
  
    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({
        error: "Acesso restrito a administradores.",
      });
    }
  
    next();
  }
  
  module.exports = { requireAdmin };