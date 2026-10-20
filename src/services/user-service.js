const bcrypt = require("bcrypt");
const { destroyUserSessions } = require("../utils/session-manager");

function createUserService(prisma, redisClient) {
  const userSelect = {
    id: true,
    username: true,
    role: true,
    isActive: true,
    createdAt: true,
  };

  async function findAll() {
    return prisma.user.findMany({
      select: userSelect,
      orderBy: {
        id: "asc",
      },
    });
  }

  async function create({ username, password, role = "USER" }) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUser) {
      const error = new Error(
        "Este nome de usuário já está cadastrado."
      );
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    return prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
      },
      select: userSelect,
    });
  }

  async function deactivate(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        isActive: true,
      },
    });

    if (!user) {
      const error = new Error("Usuário não encontrado.");
      error.status = 404;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error(
        "Este usuário já está desativado."
      );
      error.status = 409;
      throw error;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
      },
    });

    const destroyedSessions = await destroyUserSessions(
      redisClient,
      userId
    );

    return {
      username: user.username,
      destroyedSessions,
    };
  }

  return {
    findAll,
    create,
    deactivate,
  };
}

module.exports = { createUserService };