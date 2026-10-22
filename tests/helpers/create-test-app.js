const express = require("express");
const session = require("express-session");

const { createAuthRouter } = require("../../src/routes/auth");
const { createAppointmentsRouter } = require("../../src/routes/appointments");
const { createUsersRouter } = require("../../src/routes/users");

const redisClient = {
  scanIterator: async function* () {},
  get: jest.fn(),
  del: jest.fn(),
};

function testRequireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({
      error: "Autenticação necessária.",
    });
  }

  next();
}

function createTestApp(prisma) {
  const app = express();

  app.use(express.json());

  app.use(
    session({
      secret: "test-session-secret",
      resave: false,
      saveUninitialized: false,
    })
  );

  app.use((req, res, next) => {
    const userId = req.get("x-test-user-id");

    if (userId) {
      req.session.user = {
        id: Number(userId),
        username: "test-user",
        role: req.get("x-test-role") || "USER",
      };
    }

    next();
  });

  app.use((req, res, next) => {
    const userId = req.get("x-test-user-id");
    const role = req.get("x-test-role");
  
    if (userId && role) {
      req.session.user = {
        id: Number(userId),
        role,
      };
    }
  
    next();
  });

  app.use("/api/auth", createAuthRouter(prisma));
  app.use("/api", createAppointmentsRouter(prisma, testRequireAuth));
  app.use("/api/users", createUsersRouter(prisma, redisClient));

  return app;
}

module.exports = { createTestApp };