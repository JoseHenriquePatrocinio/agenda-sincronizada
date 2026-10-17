const express = require("express");
const bcrypt = require("bcrypt");

function createAuthRouter(prisma) {
  const router = express.Router();

  router.post("/login", async (req, res, next) => {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res.status(400).json({ error: "Informe usuário e senha" });
      }

      const user = await prisma.user.findUnique({ where: { username } });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      req.session.regenerate((error) => {
        if (error) {
          return next(error);
        }

        req.session.user = {
          id: user.id,
          username: user.username,
        };

        req.session.save((error) => {
          if (error) {
            return next(error);
          }

          return res.status(200).json({
            user: req.session.user,
          });
        });
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createAuthRouter };