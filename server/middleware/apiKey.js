const fs = require("fs");
const path = require("path");

const secretPath = path.join(__dirname, "..", ".api-key");

const readExpectedApiKey = () => {
  try {
    return fs.readFileSync(secretPath, "utf8").trim();
  } catch {
    return "";
  }
};

const apiKeyMiddleware = (req, res, next) => {
  const expectedApiKey = readExpectedApiKey();

  if (!expectedApiKey) {
    return res.status(500).json({
      message: "API key is not configured. Run `yarn create-secret` in the server folder.",
    });
  }

  if (req.headers["x-api-key"] !== expectedApiKey) {
    return res.status(401).json({ message: "Missing or invalid X-API-KEY header" });
  }

  next();
};

module.exports = apiKeyMiddleware;
