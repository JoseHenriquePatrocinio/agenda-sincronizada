function requireAdmin(prisma) {
  return async (req, res, next) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({
          error: "Autenticação necessária.",
        });
      }

      const user = await prisma.user.findUnique({
        where: {
          id: Number(req.session.user.id),
        },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return req.session.destroy((error) => {
          if (error) {
            return next(error);
          }

          res.clearCookie("agenda.sid");

          return res.status(401).json({
            error: "Conta desativada ou inexistente.",
          });
        });
      }

      if (user.role !== "ADMIN") {
        return res.status(403).json({
          error: "Acesso restrito a administradores.",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { requireAdmin };