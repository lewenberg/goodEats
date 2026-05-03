const express = require("express");
const router = express.Router();
const db = require("../db");

const formatUser = (row) => ({
  _id: String(row.id),
  userId: row.user_id,
  email: row.email,
  name: row.name,
  addressLine1: row.address,
  city: row.city,
  country: row.country,
  role: row.role,
});

const formatRestaurant = (row) => ({
  _id: String(row.id),
  user: row.user_id,
  ownerId: row.owner_id,
  restaurantName: row.restaurant_name,
  city: row.city,
  country: row.country,
  deliveryPrice: row.delivery_price,
  estimatedDeliveryTime: row.estimated_delivery_time,
  cuisines: JSON.parse(row.cuisines || "[]"),
  menuItems: JSON.parse(row.menu_items || "[]"),
  imageUrl: row.image_url,
  lastUpdated: row.last_updated,
  isActive: Boolean(row.is_active),
});

const formatOrder = (row) => ({
  _id: String(row.id),
  orderId: row.order_id,
  customerId: row.customer_id,
  restaurantId: String(row.restaurant_id),
  items: JSON.parse(row.items || "[]"),
  subtotal: row.subtotal,
  deliveryPrice: row.delivery_price,
  total: row.total,
  status: row.status,
  deliveryName: row.delivery_name,
  deliveryAddress: row.delivery_address,
  createdAt: row.created_at,
  restaurantName: row.restaurant_name,
  customerName: row.customer_name,
});

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission for this action" });
  }
  next();
};

const getRestaurant = (id) =>
  db.prepare("SELECT * FROM restaurants WHERE id = ?").get(id);

const assertCanManageRestaurant = (req, restaurant) => {
  if (req.user.role === "admin") return;
  if (req.user.role === "owner" && restaurant?.owner_id === req.user.userId) return;
  const error = new Error("You can only manage your assigned restaurant");
  error.status = 403;
  throw error;
};

router.get("/me", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE user_id = ?").get(req.user.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(formatUser(user));
});

router.get("/users", requireRole("admin"), (_req, res) => {
  res.json(db.prepare("SELECT * FROM users ORDER BY role, name").all().map(formatUser));
});

router.get("/restaurants", (req, res) => {
  const rows = req.user.role === "owner"
    ? db.prepare("SELECT * FROM restaurants WHERE owner_id = ? ORDER BY restaurant_name").all(req.user.userId)
    : db.prepare("SELECT * FROM restaurants ORDER BY restaurant_name").all();
  res.json(rows.map(formatRestaurant));
});

router.post("/restaurants", requireRole("admin"), (req, res) => {
  const {
    restaurantName,
    city,
    country,
    deliveryPrice,
    estimatedDeliveryTime,
    cuisines,
    menuItems,
    imageUrl,
    ownerId,
  } = req.body;

  if (!restaurantName || !city || !country) {
    return res.status(400).json({ message: "Restaurant name, city, and country are required" });
  }

  const result = db.prepare(`
    INSERT INTO restaurants
      (user_id, owner_id, restaurant_name, city, country, delivery_price,
       estimated_delivery_time, cuisines, menu_items, image_url, last_updated, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    req.user.userId,
    ownerId || null,
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

  res.status(201).json(formatRestaurant(getRestaurant(result.lastInsertRowid)));
});

router.put("/restaurants/:id", requireRole("admin", "owner"), (req, res) => {
  try {
    const restaurant = getRestaurant(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    assertCanManageRestaurant(req, restaurant);

    const current = formatRestaurant(restaurant);
    const name = req.user.role === "owner"
      ? current.restaurantName
      : req.body.restaurantName || current.restaurantName;

    db.prepare(`
      UPDATE restaurants
      SET owner_id = ?, restaurant_name = ?, city = ?, country = ?, delivery_price = ?,
          estimated_delivery_time = ?, cuisines = ?, menu_items = ?, image_url = ?,
          is_active = ?, last_updated = ?
      WHERE id = ?
    `).run(
      req.user.role === "admin" ? req.body.ownerId || null : current.ownerId,
      name,
      req.body.city || current.city,
      req.body.country || current.country,
      Number(req.body.deliveryPrice ?? current.deliveryPrice),
      Number(req.body.estimatedDeliveryTime ?? current.estimatedDeliveryTime),
      JSON.stringify(req.body.cuisines ?? current.cuisines),
      JSON.stringify(req.body.menuItems ?? current.menuItems),
      req.body.imageUrl ?? current.imageUrl,
      req.user.role === "admin" ? (req.body.isActive ? 1 : 0) : Number(current.isActive),
      new Date().toISOString(),
      req.params.id
    );

    res.json(formatRestaurant(getRestaurant(req.params.id)));
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

router.delete("/restaurants/:id", requireRole("admin"), (req, res) => {
  db.prepare("DELETE FROM restaurants WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

router.get("/orders", (req, res) => {
  let rows;
  if (req.user.role === "admin") {
    rows = db.prepare(`
      SELECT orders.*, restaurants.restaurant_name, users.name as customer_name
      FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      JOIN users ON users.user_id = orders.customer_id
      ORDER BY orders.created_at DESC
    `).all();
  } else if (req.user.role === "owner") {
    rows = db.prepare(`
      SELECT orders.*, restaurants.restaurant_name, users.name as customer_name
      FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      JOIN users ON users.user_id = orders.customer_id
      WHERE restaurants.owner_id = ?
      ORDER BY orders.created_at DESC
    `).all(req.user.userId);
  } else {
    rows = db.prepare(`
      SELECT orders.*, restaurants.restaurant_name, users.name as customer_name
      FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      JOIN users ON users.user_id = orders.customer_id
      WHERE orders.customer_id = ?
      ORDER BY orders.created_at DESC
    `).all(req.user.userId);
  }

  res.json(rows.map(formatOrder));
});

router.post("/orders", requireRole("customer"), (req, res) => {
  const { restaurantId, items, deliveryName, deliveryAddress } = req.body;
  const restaurant = getRestaurant(restaurantId);
  if (!restaurant || !restaurant.is_active) {
    return res.status(404).json({ message: "Restaurant not available" });
  }

  const menu = JSON.parse(restaurant.menu_items || "[]");
  const orderItems = (items || [])
    .map((item) => {
      const menuItem = menu.find((candidate) => candidate._id === item.menuItemId);
      if (!menuItem) return null;
      return {
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: Math.max(1, Number(item.quantity) || 1),
      };
    })
    .filter(Boolean);

  if (orderItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + restaurant.delivery_price;
  const orderId = `ord-${Date.now()}`;

  const result = db.prepare(`
    INSERT INTO orders
      (order_id, customer_id, restaurant_id, items, subtotal, delivery_price, total,
       status, delivery_name, delivery_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Placed', ?, ?, ?)
  `).run(
    orderId,
    req.user.userId,
    restaurant.id,
    JSON.stringify(orderItems),
    subtotal,
    restaurant.delivery_price,
    total,
    deliveryName || "",
    deliveryAddress || "",
    new Date().toISOString()
  );

  const created = db.prepare(`
    SELECT orders.*, restaurants.restaurant_name, users.name as customer_name
    FROM orders
    JOIN restaurants ON restaurants.id = orders.restaurant_id
    JOIN users ON users.user_id = orders.customer_id
    WHERE orders.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(formatOrder(created));
});

router.patch("/orders/:id/status", requireRole("admin", "owner"), (req, res) => {
  const order = db.prepare(`
    SELECT orders.*, restaurants.owner_id
    FROM orders
    JOIN restaurants ON restaurants.id = orders.restaurant_id
    WHERE orders.id = ?
  `).get(req.params.id);

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (req.user.role === "owner" && order.owner_id !== req.user.userId) {
    return res.status(403).json({ message: "You can only update your restaurant orders" });
  }

  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(req.body.status || "Preparing", req.params.id);
  res.json({ ok: true });
});

module.exports = router;
