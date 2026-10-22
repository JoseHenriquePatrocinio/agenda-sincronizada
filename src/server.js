require("dotenv").config();

const http = require("node:http");
const { Server } = require("socket.io");
const { createApp } = require("./app");
const { connectRedis, redisClient } = require("./config/redis.js");

async function startServer() {
  try {
    await connectRedis();

    const port = Number(process.env.PORT || 3000);
    const app = createApp(redisClient);
    const server = http.createServer(app);
    const io = new Server(server);

    app.set("io", io);
    io.engine.use(app.get("sessionMiddleware"));

    io.use((socket, next) => {
      const user = socket.request.session?.user;

      if (!user) {
        return next(new Error("Não autenticado."));
      }

      socket.data.userId = Number(user.id);

      next();
    });

    io.on("connection", (socket) => {
      const userId = socket.data.userId;

      socket.join(`user:${userId}`);

      console.log(`Cliente conectado ao Socket.IO: ${socket.id}`);

      socket.on("disconnect", () => {
        console.log(
          `Cliente desconectado do Socket.IO: ${socket.id}`
        );
      });
    });

    server.listen(port, () => {
      console.log(`Agenda disponível em http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error("Erro ao iniciar o servidor:", error);
  process.exit(1);
});