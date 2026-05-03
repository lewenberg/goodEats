// routes/restaurant.js - Restaurant endpoints
// GET  /api/my/restaurant -> get my restaurant
// POST /api/my/restaurant -> create my restaurant
// PUT  /api/my/restaurant -> update my restaurant

const express = require("express");
const router = express.Router();
const db = require("../db");

// Helper: convert DB row -> API shape the frontend expects
const formatRestaurant = (row) => ({
  _id: String(row.id),
  user: row.user_id,
  restaurantName: row.restaurant_name,
  city: row.city,
  country: row.country,
  deliveryPrice: row.delivery_price,
  estimatedDeliveryTime: row.estimated_delivery_time,
  cuisines: JSON.parse(row.cuisines),
  menuItems: JSON.parse(row.menu_items),
  imageUrl: row.image_url,
  lastUpdated: row.last_updated,
});

// GET /api/my/restaurant
router.get("/", (req, res) => {
  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE user_id = ?")
    .get(req.user.userId);

  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  res.json(formatRestaurant(restaurant));
});

// POST /api/my/restaurant  (create)
router.post("/", (req, res) => {
  const {
    restaurantName,
    city,
    country,
    deliveryPrice,
    estimatedDeliveryTime,
    cuisines,
    menuItems,
    imageUrl,
  } = req.body;

  // Only one restaurant per user
  const existing = db
    .prepare("SELECT id FROM restaurants WHERE user_id = ?")
    .get(req.user.userId);

  if (existing) {
    return res
      .status(409)
      .json({ message: "Restaurant already exists. Use PUT to update." });
  }

  const result = db
    .prepare(`
      INSERT INTO restaurants
        (user_id, restaurant_name, city, country, delivery_price,
         estimated_delivery_time, cuisines, menu_items, image_url, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      req.user.userId,
      restaurantName,
      city,
      country,
      Number(deliveryPrice) || 0,
      Number(estimatedDeliveryTime) || 30,
      JSON.stringify(cuisines || []),
      JSON.stringify(menuItems || []),
      imageUrl || "",
      new Date().toISOString()
    );

  const newRestaurant = db
    .prepare("SELECT * FROM restaurants WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(formatRestaurant(newRestaurant));
});

// PUT /api/my/restaurant  (update)
router.put("/", (req, res) => {
  const {
    restaurantName,
    city,
    country,
    deliveryPrice,
    estimatedDeliveryTime,
    cuisines,
    menuItems,
    imageUrl,
  } = req.body;

  const existing = db
    .prepare("SELECT id FROM restaurants WHERE user_id = ?")
    .get(req.user.userId);

  if (!existing) {
    return res
      .status(404)
      .json({ message: "Restaurant not found. Create one first." });
  }

  db.prepare(`
    UPDATE restaurants
    SET restaurant_name = ?, city = ?, country = ?, delivery_price = ?,
        estimated_delivery_time = ?, cuisines = ?, menu_items = ?,
        image_url = ?, last_updated = ?
    WHERE user_id = ?
  `).run(
    restaurantName,
    city,
    country,
    Number(deliveryPrice) || 0,
    Number(estimatedDeliveryTime) || 30,
    JSON.stringify(cuisines || []),
    JSON.stringify(menuItems || []),
    imageUrl || "",
    new Date().toISOString(),
    req.user.userId
  );

  const updated = db
    .prepare("SELECT * FROM restaurants WHERE user_id = ?")
    .get(req.user.userId);

  res.json(formatRestaurant(updated));
});

module.exports = router;
