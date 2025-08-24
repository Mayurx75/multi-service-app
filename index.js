const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const client = require("prom-client"); // Prometheus client

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Prometheus Setup =====
const register = new client.Registry();
client.collectDefaultMetrics({ register }); // default Node.js / process metrics

// Custom HTTP request counter
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
});
register.registerMetric(httpRequestCounter);

// Middleware to count requests
app.use((req, res, next) => {
  httpRequestCounter.inc();
  next();
});

// ===== Middleware =====
app.use(bodyParser.json());

// ===== MongoDB connection =====
mongoose
  .connect("mongodb://mongo:27017/devopsdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ===== Routes =====
const userRoutes = require("./routes/user");
app.use("/users", userRoutes);

// ===== Default route =====
app.get("/", (req, res) => {
  res.send("🚀 DevOps Monitoring Project Running!");
});

// ===== Metrics endpoint =====
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
