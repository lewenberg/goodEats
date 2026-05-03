// routes/search.js - Public restaurant search endpoint
// GET /api/restaurant/search/:city?searchQuery=&page=&selectedCuisines=&sortOption=

const express = require("express");
const router = express.Router();
const db = require("../db");

const PAGE_SIZE = 10;

router.get("/:city", (req, res) => {
  const { city } = req.params;
  const {
    searchQuery = "",
    page = "1",
    selectedCuisines = "",
    sortOption = "bestMatch",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const cuisineList = selectedCuisines
    ? selectedCuisines.split(",").filter(Boolean)
    : [];

  // Fetch all restaurants in city (case-insensitive)
  let rows = db
    .prepare("SELECT * FROM restaurants WHERE LOWER(city) = LOWER(?)")
    .all(city);

  // Filter by searchQuery (restaurant name or cuisines)
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.restaurant_name.toLowerCase().includes(q) ||
        r.cuisines.toLowerCase().includes(q)
    );
  }

  // Filter by selected cuisines
  if (cuisineList.length > 0) {
    rows = rows.filter((r) => {
      const rc = JSON.parse(r.cuisines).map((c) => c.toLowerCase());
      return cuisineList.some((c) => rc.includes(c.toLowerCase()));
    });
  }

  // Sort
  if (sortOption === "deliveryPrice") {
    rows.sort((a, b) => a.delivery_price - b.delivery_price);
  } else if (sortOption === "estimatedDeliveryTime") {
    rows.sort((a, b) => a.estimated_delivery_time - b.estimated_delivery_time);
  }
  // default "bestMatch" = natural order

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (pageNum - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);

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

  res.json({
    data: pageRows.map(formatRestaurant),
    pagination: { total, page: pageNum, pages },
  });
});

module.exports = router;
