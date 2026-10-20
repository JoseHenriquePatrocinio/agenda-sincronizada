const path = require("node:path");
const express = require("express");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { createAuthRouter } = require("./routes/auth");
const { requireAuth } = require("./middleware/auth");
const { createAppointmentsRouter } = require("./routes/appointments");
const { createUsersRouter } = require("./routes/users");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter });

function createApp(redisClient) {
  const app = express();

  const sessionStore = new RedisStore({
    client: redisClient,
    prefix: process.env.SESSION_PREFIX,
    ttl: 8 * 60 * 60
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const sessionMiddleware = session({
    name: "agenda.sid",
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000
    },
  });

  app.use(sessionMiddleware);

  app.set("sessionMiddleware", sessionMiddleware);

  app.use("/api/auth", createAuthRouter(prisma));

  app.use("/api/users", createUsersRouter(prisma, redisClient));

  app.get("/api/health", requireAuth(prisma), (_req, res) => res.json({ status: "ok" }));

  app.use("/api", createAppointmentsRouter(prisma, requireAuth(prisma)));
  
  app.get("/", requireAuth(prisma), (_req, res) => {
    res.sendFile(
      path.join(__dirname, "..", "public", "agenda.html")
    );
  });

  app.use(express.static(path.join(__dirname, "..", "public")));

  return app;
}

module.exports = { createApp };