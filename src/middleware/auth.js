function requireAuth(prisma) {
  return async (req, res, next) => {
    try {
      if (!req.session?.user) {
        return res.redirect("/login.html");
      }

      const user = await prisma.user.findUnique({
        where: {
          id: Number(req.session.user.id),
        },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return req.session.destroy((error) => {
          if (error) {
            return next(error);
          }

          res.clearCookie("agenda.sid");
          return res.redirect("/login.html");
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { requireAuth };