// routes/user.js - User endpoints
// GET  /api/my/user  -> get logged-in user's profile
// POST /api/my/user  -> create user (upsert)
// PUT  /api/my/user  -> update user profile

const express = require("express");
const router = express.Router();
const db = require("../db");

// Helper: convert DB row -> API shape the frontend expects
const formatUser = (row) => ({
  _id: String(row.id),
  email: row.email,
  name: row.name,
  addressLine1: row.address,
  city: row.city,
  country: row.country,
});

// GET /api/my/user
router.get("/", (req, res) => {
  const user = db
    .prepare("SELECT * FROM users WHERE user_id = ?")
    .get(req.user.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(formatUser(user));
});

// POST /api/my/user  (upsert on first login)
router.post("/", (req, res) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ message: "userId and email are required" });
  }

  // If already exists just return them
  const existing = db
    .prepare("SELECT * FROM users WHERE user_id = ?")
    .get(userId);

  if (existing) {
    return res.json(formatUser(existing));
  }

  const result = db
    .prepare("INSERT INTO users (user_id, email) VALUES (?, ?)")
    .run(userId, email);

  const newUser = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(formatUser(newUser));
});

// PUT /api/my/user  (update profile)
router.put("/", (req, res) => {
  const { name, addressLine1, city, country } = req.body;

  db.prepare(`
    UPDATE users
    SET name = ?, address = ?, city = ?, country = ?
    WHERE user_id = ?
  `).run(name, addressLine1, city, country, req.user.userId);

  const updated = db
    .prepare("SELECT * FROM users WHERE user_id = ?")
    .get(req.user.userId);

  res.json(formatUser(updated));
});

module.exports = router;
