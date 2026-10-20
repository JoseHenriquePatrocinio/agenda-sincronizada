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
      if (!socket.request.session?.user) {
        return next(new Error("Não autenticado."));
      }
  
      next();
    });  

    io.on("connection", (socket) => {
      console.log("Cliente conectado ao Socket.IO:", socket.id);
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