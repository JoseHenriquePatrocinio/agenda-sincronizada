const path = require("node:path");
const express = require("express");

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(express.static(path.join(__dirname, "..", "public")));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  return app;
}

module.exports = { createApp };
