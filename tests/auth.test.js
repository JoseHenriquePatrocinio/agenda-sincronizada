const request = require("supertest");
const bcrypt = require("bcrypt");
const { createTestApp } = require("./helpers/create-test-app");

describe("Auth", () => {
  let app;
  let prisma;
  let passwordHash;

  beforeEach(async () => {
    passwordHash = await bcrypt.hash("admin123", 4);

    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    app = createTestApp(prisma);
  });

  test("deve autenticar com credenciais válidas", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      username: "admin",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        username: "admin",
        password: "admin123",
      });

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.username).toBe("admin");
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  test("deve rejeitar senha incorreta", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      username: "admin",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        username: "admin",
        password: "senha-incorreta",
      });

    expect(response.status).toBe(401);
  });

  test("deve rejeitar usuário inexistente", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        username: "inexistente",
        password: "admin123",
      });

    expect(response.status).toBe(401);
  });

  test("deve rejeitar login sem usuário ou senha", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin" });

    expect(response.status).toBe(400);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});