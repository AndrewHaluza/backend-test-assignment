const { resolve } = require("path");

require("dotenv").config();

const serviceAccountPath = resolve(
  process.cwd(),
  "credentials",
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH
);

module.exports = require(serviceAccountPath);
