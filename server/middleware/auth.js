const TOKEN_MAP = {
  "token-admin-001": { userId: "admin-001", email: "admin@goodeats.test", role: "admin" },
  "token-owner-001": { userId: "owner-001", email: "maria@copperkettle.test", role: "owner" },
  "token-owner-002": { userId: "owner-002", email: "kenji@noodleworks.test", role: "owner" },
  "token-customer-001": { userId: "customer-001", email: "jordan@example.test", role: "customer" },
  "token-customer-002": { userId: "customer-002", email: "priya@example.test", role: "customer" },
  "token-customer-003": { userId: "customer-003", email: "sam@example.test", role: "customer" },
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  const user = TOKEN_MAP[authHeader.slice(7)];
  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = user;
  next();
};

module.exports = authMiddleware;
