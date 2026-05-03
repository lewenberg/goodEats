// db.js - SQLite schema and seed data for the demo food ordering app

const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "food.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT    UNIQUE NOT NULL,
    email      TEXT    NOT NULL,
    name       TEXT    DEFAULT '',
    address    TEXT    DEFAULT '',
    city       TEXT    DEFAULT '',
    country    TEXT    DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS restaurants (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id                 TEXT    NOT NULL,
    restaurant_name         TEXT    NOT NULL,
    city                    TEXT    NOT NULL,
    country                 TEXT    NOT NULL,
    delivery_price          INTEGER NOT NULL DEFAULT 0,
    estimated_delivery_time INTEGER NOT NULL DEFAULT 30,
    cuisines                TEXT    NOT NULL DEFAULT '[]',
    menu_items              TEXT    NOT NULL DEFAULT '[]',
    image_url               TEXT    DEFAULT '',
    last_updated            TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id       TEXT UNIQUE NOT NULL,
    customer_id    TEXT NOT NULL,
    restaurant_id  INTEGER NOT NULL,
    items          TEXT NOT NULL DEFAULT '[]',
    subtotal       INTEGER NOT NULL DEFAULT 0,
    delivery_price INTEGER NOT NULL DEFAULT 0,
    total          INTEGER NOT NULL DEFAULT 0,
    status         TEXT NOT NULL DEFAULT 'Placed',
    delivery_name  TEXT NOT NULL DEFAULT '',
    delivery_address TEXT NOT NULL DEFAULT '',
    created_at     TEXT NOT NULL
  );
`);

const columns = (table) =>
  db.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name);

const addColumn = (table, name, definition) => {
  if (!columns(table).includes(name)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
};

addColumn("users", "role", "TEXT NOT NULL DEFAULT 'customer'");
addColumn("restaurants", "owner_id", "TEXT DEFAULT NULL");
addColumn("restaurants", "is_active", "INTEGER NOT NULL DEFAULT 1");

const now = () => new Date().toISOString();
const seedUserIds = [
  "admin-001",
  "owner-001",
  "owner-002",
  "customer-001",
  "customer-002",
  "customer-003",
];

db.prepare(
  `DELETE FROM users WHERE user_id NOT IN (${seedUserIds.map(() => "?").join(",")})`
).run(...seedUserIds);

const upsertUser = db.prepare(`
  INSERT INTO users (user_id, email, name, address, city, country, role)
  VALUES (@userId, @email, @name, @address, @city, @country, @role)
  ON CONFLICT(user_id) DO UPDATE SET
    email = excluded.email,
    name = excluded.name,
    address = excluded.address,
    city = excluded.city,
    country = excluded.country,
    role = excluded.role
`);

[
  {
    userId: "admin-001",
    email: "admin@goodeats.test",
    name: "Avery Admin",
    address: "1 Platform Plaza",
    city: "New York",
    country: "USA",
    role: "admin",
  },
  {
    userId: "owner-001",
    email: "maria@copperkettle.test",
    name: "Maria Santos",
    address: "88 Orchard Street",
    city: "New York",
    country: "USA",
    role: "owner",
  },
  {
    userId: "owner-002",
    email: "kenji@noodleworks.test",
    name: "Kenji Tanaka",
    address: "400 Sunset Blvd",
    city: "Los Angeles",
    country: "USA",
    role: "owner",
  },
  {
    userId: "customer-001",
    email: "jordan@example.test",
    name: "Jordan Lee",
    address: "42 Grove Street",
    city: "New York",
    country: "USA",
    role: "customer",
  },
  {
    userId: "customer-002",
    email: "priya@example.test",
    name: "Priya Shah",
    address: "77 Bay Road",
    city: "New York",
    country: "USA",
    role: "customer",
  },
  {
    userId: "customer-003",
    email: "sam@example.test",
    name: "Sam Rivera",
    address: "210 Hillcrest Ave",
    city: "Los Angeles",
    country: "USA",
    role: "customer",
  },
].forEach((user) => upsertUser.run(user));

const seedRestaurant = db.prepare(`
  INSERT INTO restaurants
    (user_id, owner_id, restaurant_name, city, country, delivery_price,
     estimated_delivery_time, cuisines, menu_items, image_url, last_updated, is_active)
  VALUES (@createdBy, @ownerId, @restaurantName, @city, @country, @deliveryPrice,
    @estimatedDeliveryTime, @cuisines, @menuItems, @imageUrl, @lastUpdated, 1)
  ON CONFLICT(id) DO NOTHING
`);

const seededRestaurant = db
  .prepare("SELECT id FROM restaurants WHERE restaurant_name = ?")
  .get("Copper Kettle Kitchen");

if (!seededRestaurant) {
  db.prepare("DELETE FROM orders").run();
  db.prepare("DELETE FROM restaurants").run();

  [
    {
      createdBy: "admin-001",
      ownerId: "owner-001",
      restaurantName: "Copper Kettle Kitchen",
      city: "New York",
      country: "USA",
      deliveryPrice: 399,
      estimatedDeliveryTime: 28,
      cuisines: ["Comfort", "American", "Brunch"],
      imageUrl:
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&auto=format&fit=crop",
      menuItems: [
        { _id: "ck-1", name: "Short Rib Mac", price: 1699, description: "Braised short rib, cheddar cream, toasted crumbs" },
        { _id: "ck-2", name: "Hot Honey Chicken", price: 1499, description: "Crispy chicken, pepper honey, herb slaw" },
        { _id: "ck-3", name: "Market Greens", price: 1199, description: "Greens, apple, goat cheese, cider vinaigrette" },
        { _id: "ck-4", name: "Skillet Cookie", price: 799, description: "Brown butter cookie with vanilla cream" },
      ],
    },
    {
      createdBy: "admin-001",
      ownerId: "owner-002",
      restaurantName: "Noodleworks Social",
      city: "Los Angeles",
      country: "USA",
      deliveryPrice: 299,
      estimatedDeliveryTime: 24,
      cuisines: ["Japanese", "Noodles", "Street Food"],
      imageUrl:
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&auto=format&fit=crop",
      menuItems: [
        { _id: "nw-1", name: "Shoyu Ramen", price: 1599, description: "Chicken broth, soy tare, egg, scallion" },
        { _id: "nw-2", name: "Spicy Miso Ramen", price: 1699, description: "Miso broth, chili crisp, pork, corn" },
        { _id: "nw-3", name: "Crispy Gyoza", price: 899, description: "Pan-seared dumplings with ponzu" },
        { _id: "nw-4", name: "Yuzu Lemonade", price: 499, description: "Bright citrus soda over ice" },
      ],
    },
    {
      createdBy: "admin-001",
      ownerId: null,
      restaurantName: "Taco Atlas",
      city: "New York",
      country: "USA",
      deliveryPrice: 199,
      estimatedDeliveryTime: 18,
      cuisines: ["Mexican", "Tacos", "Vegan"],
      imageUrl:
        "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&auto=format&fit=crop",
      menuItems: [
        { _id: "ta-1", name: "Carne Asada Trio", price: 1399, description: "Three tacos, salsa roja, onion, cilantro" },
        { _id: "ta-2", name: "Mushroom Al Pastor", price: 1299, description: "Pineapple, achiote, roasted mushrooms" },
        { _id: "ta-3", name: "Chips and Guac", price: 799, description: "Avocado, lime, pepitas, warm chips" },
        { _id: "ta-4", name: "Hibiscus Agua Fresca", price: 399, description: "Tart hibiscus tea, citrus, mint" },
      ],
    },
  ].forEach((restaurant) =>
    seedRestaurant.run({
      ...restaurant,
      cuisines: JSON.stringify(restaurant.cuisines),
      menuItems: JSON.stringify(restaurant.menuItems),
      lastUpdated: now(),
    })
  );
}

module.exports = db;
