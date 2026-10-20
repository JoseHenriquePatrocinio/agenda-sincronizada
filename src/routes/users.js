const express = require("express");
const bcrypt = require("bcrypt");
const { requireAdmin } = require("../middleware/requireAdmin");
const { UserValidator } = require("../utils/user-validator");

function createUsersRouter(prisma) {
  const router = express.Router();

  router.use(requireAdmin);

  router.get("/", async (req, res, next) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          id: "asc",
        },
      });

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

      const existingUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (existingUser) {
        return res.status(409).json({
          error: "Este nome de usuário já está cadastrado.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          username,
          passwordHash,
          role,
        },
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      return res.status(201).json({
        message: "Usuário cadastrado com sucesso.",
        user,
      });
    } catch (error) {
      if (error.code === "P2002") {
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

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          isActive: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          error: "Usuário não encontrado.",
        });
      }

      if (!user.isActive) {
        return res.status(409).json({
          error: "Este usuário já está desativado.",
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
        },
      });

      return res.json({
        message: `Usuário "${user.username}" desativado com sucesso.`,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createUsersRouter };