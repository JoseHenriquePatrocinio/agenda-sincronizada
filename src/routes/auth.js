const express = require("express");
const { createAuthService } = require("../services/auth-service");

function createAuthRouter(prisma) {
  const router = express.Router();
  const authService = createAuthService(prisma);

  router.post("/login", async (req, res, next) => {
    try {
      const { username, password } = req.body || {};

      if (!username || !password) {
        return res.status(400).json({
          error: "Informe usuário e senha",
        });
      }

      const user = await authService.authenticate(
        username,
        password
      );

      req.session.regenerate((error) => {
        if (error) {
          return next(error);
        }

        req.session.user = user;

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
      if (error.status) {
        return res.status(error.status).json({
          error: error.message,
        });
      }

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