const request = require("supertest");
const { createTestApp } = require("./helpers/create-test-app");

describe("Users", () => {
  let app;
  let prisma;

  const adminHeaders = {
    "x-test-user-id": "1",
    "x-test-role": "ADMIN",
  };

  const userHeaders = {
    "x-test-user-id": "2",
    "x-test-role": "USER",
  };

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    app = createTestApp(prisma);
  });

  test("deve impedir acesso de usuário comum ao módulo administrativo", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 2,
      role: "USER",
      isActive: true,
    });
  
    const response = await request(app)
      .get("/api/users")
      .set(userHeaders);
  
    expect(response.status).toBe(403);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  test("deve exigir autenticação para listar usuários", async () => {
    const response = await request(app).get("/api/users");

    expect([401, 302]).toContain(response.status);
  });

  test("deve permitir que um administrador liste usuários", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      role: "ADMIN",
      isActive: true,
    });
  
    prisma.user.findMany.mockResolvedValue([
      { id: 1, username: "admin", role: "ADMIN", isActive: true },
      { id: 2, username: "admin2", role: "USER", isActive: true },
    ]);
  
    const response = await request(app)
      .get("/api/users")
      .set(adminHeaders);
  
    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(2);
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  test("deve desativar um usuário existente", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({
        id: 1,
        role: "ADMIN",
        isActive: true,
      })
      .mockResolvedValueOnce({
        id: 2,
        username: "admin2",
        role: "USER",
        isActive: true,
      });
  
    prisma.user.update.mockResolvedValue({
      id: 2,
      username: "admin2",
      role: "USER",
      isActive: false,
    });
  
    const response = await request(app)
      .patch("/api/users/2/deactivate")
      .set(adminHeaders);
  
    expect(response.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalled();
  });
});