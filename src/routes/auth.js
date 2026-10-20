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

      if (!user.isActive) {
        return res.status(403).json({error: "Esta conta está desativada.",});
      }

      req.session.regenerate((error) => {
        if (error) {
          return next(error);
        }

        req.session.user = {
          id: user.id,
          username: user.username,
          role: user.role,
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

  router.post("/logout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) {
        return next(error);
      }
  
      res.clearCookie("agenda.sid");
      res.sendStatus(204);
    });
  });

  return router;
}

module.exports = { createAuthRouter };