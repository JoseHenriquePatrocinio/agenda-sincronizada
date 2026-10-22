const request = require("supertest");
const { createTestApp } = require("./helpers/create-test-app");

describe("Appointments", () => {
  let app;
  let prisma;

  const adminHeaders = {
    "x-test-user-id": "1",
    "x-test-role": "ADMIN",
  };

  beforeEach(() => {
    prisma = {
      professional: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      appointment: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    app = createTestApp(prisma);
  });

  test("deve exigir autenticação para consultar profissionais", async () => {
    const response = await request(app).get("/api/professionals");

    expect(response.status).toBe(401);
  });

  test("deve listar profissionais para usuário autenticado", async () => {
    prisma.professional.findMany.mockResolvedValue([
      { id: 1, name: "Dra. Maria da Silva" },
    ]);

    const response = await request(app)
      .get("/api/professionals")
      .set(adminHeaders);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe("Dra. Maria da Silva");
  });

  test("deve consultar a agenda por profissional e data", async () => {
    prisma.appointment.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get("/api/appointments")
      .query({
        professionalId: 1,
        date: "2026-10-21",
      })
      .set(adminHeaders);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(prisma.appointment.findMany).toHaveBeenCalled();
  });

  test("deve rejeitar agendamento com dados obrigatórios ausentes", async () => {
    const response = await request(app)
      .post("/api/appointments")
      .set(adminHeaders)
      .send({});

    expect(response.status).toBe(400);
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });

  test("deve rejeitar consulta sem autenticação", async () => {
    const response = await request(app)
      .get("/api/appointments")
      .query({
        professionalId: 1,
        date: "2026-10-21",
      });

    expect(response.status).toBe(401);
  });

  test("deve rejeitar consultas sobrepostas para o mesmo profissional", async () => {
    prisma.professional.findUnique.mockResolvedValue({
      id: 1,
    });
  
    prisma.appointment.findFirst.mockResolvedValue({
      id: 10,
    });
  
    const response = await request(app)
      .post("/api/appointments")
      .set(adminHeaders)
      .send({
        professionalId: 1,
        patientName: "João da Silva",
        title: "Consulta de retorno",
        startAt: "2026-10-21T10:30:00-03:00",
        endAt: "2026-10-21T11:30:00-03:00",
      });
  
    expect(response.status).toBe(409);
    expect(response.body.error).toBe(
      "Esse profissional já possui um compromisso nesse horário."
    );
  
    expect(prisma.appointment.findFirst).toHaveBeenCalled();
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });
});