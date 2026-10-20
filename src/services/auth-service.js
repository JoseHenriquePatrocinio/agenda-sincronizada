const bcrypt = require("bcrypt");

function createAuthService(prisma) {
  async function authenticate(username, password) {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      const error = new Error("Credenciais inválidas.");
      error.status = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error("Esta conta está desativada.");
      error.status = 403;
      throw error;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  return { authenticate };
}

module.exports = { createAuthService };