const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const secretPath = path.join(__dirname, "..", ".api-key");
const apiKey = crypto.randomBytes(32).toString("hex");

fs.writeFileSync(secretPath, `${apiKey}\n`, { mode: 0o600 });

console.log("API key created at server/.api-key");
console.log(`Add this to your frontend .env as VITE_API_KEY=${apiKey}`);
