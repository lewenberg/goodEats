// index.js - Main Express server entry point

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const apiKeyMiddleware = require("./middleware/apiKey");
const authMiddleware = require("./middleware/auth");
const userRoutes = require("./routes/user");
const restaurantRoutes = require("./routes/restaurant");
const searchRoutes = require("./routes/search");
const appRoutes = require("./routes/app");

const app = express();
const PORT = process.env.PORT || 7000;

// ── Middleware ──────────────────────────────────────────────────────────────

// Allow requests from the Vite frontend
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));

// Parse JSON bodies
app.use(express.json());

// ── Health check (no auth needed) ──────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Food ordering API is running" });
});

app.use("/api", apiKeyMiddleware);

// ── Public routes (no auth) ──────────────────────────────────────────────────
app.use("/api/restaurant/search", searchRoutes);

// ── Protected routes (all require Bearer token) ─────────────────────────────
app.use("/api/my/user",       authMiddleware, userRoutes);
app.use("/api/my/restaurant", authMiddleware, restaurantRoutes);
app.use("/api/app", authMiddleware, appRoutes);

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
