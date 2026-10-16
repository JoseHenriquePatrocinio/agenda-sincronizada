require("dotenv").config();

const http = require("node:http");
const { createApp } = require("./app");

const port = Number(process.env.PORT || 3000);
const app = createApp();
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Agenda disponível em http://localhost:${port}`);
});