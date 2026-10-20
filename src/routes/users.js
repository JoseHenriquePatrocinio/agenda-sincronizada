const express = require("express");
const { requireAdmin } = require("../middleware/requireAdmin");
const { UserValidator } = require("../utils/user-validator");
const { createUserService } = require("../services/user-service");

function createUsersRouter(prisma, redisClient) {
  const router = express.Router();
  const userService = createUserService(prisma, redisClient);

  router.use(requireAdmin(prisma));

  router.get("/", async (req, res, next) => {
    try {
      const users = await userService.findAll();
      const currentUserId = Number(req.session.user.id);

      const usersWithCurrentUserFlag = users.map((user) => ({
        ...user,
        isCurrentUser: user.id === currentUserId,
      }));

      return res.json({
        users: usersWithCurrentUserFlag,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const { username, password, role = "USER" } = req.body || {};

      const usernameError = UserValidator.validateUsername(username);

      if (usernameError) {
        return res.status(400).json({
          error: usernameError,
        });
      }

      const passwordError = UserValidator.validatePassword(password);

      if (passwordError) {
        return res.status(400).json({
          error: passwordError,
        });
      }

      const roleError = UserValidator.validateRole(role);

      if (roleError) {
        return res.status(400).json({
          error: roleError,
        });
      }

      const user = await userService.create({
        username,
        password,
        role,
      });

      return res.status(201).json({
        message: "Usuário cadastrado com sucesso.",
        user,
      });
    } catch (error) {
      if (error.code === "P2002" || error.status === 409) {
        return res.status(409).json({
          error: "Este nome de usuário já está cadastrado.",
        });
      }

      next(error);
    }
  });

  router.patch("/:id/deactivate", async (req, res, next) => {
    try {
      const userId = UserValidator.validateUserId(req.params.id);

      if (userId === null) {
        return res.status(400).json({
          error: "ID de usuário inválido.",
        });
      }

      const currentUserId = Number(req.session.user.id);

      if (userId === currentUserId) {
        return res.status(400).json({
          error: "Você não pode desativar sua própria conta.",
        });
      }

      const result = await userService.deactivate(userId);

      return res.json({
        message: `Usuário "${result.username}" desativado com sucesso.`,
        destroyedSessions: result.destroyedSessions,
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

  return router;
}

module.exports = { createUsersRouter };