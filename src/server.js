require("dotenv").config();

const http = require("node:http");
const { createApp } = require("./app");
const { connectRedis, redisClient } = require("./config/redis.js");

async function startServer() {
  try {
    await connectRedis();

    const port = Number(process.env.PORT || 3000);
    const app = createApp(redisClient);
    const server = http.createServer(app);

    server.listen(port, () => {
      console.log(`Agenda disponível em http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
}

startServer();