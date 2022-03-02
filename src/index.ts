const admin = require("firebase-admin");

const serviceAccount = require("./credentials");
const PubSubInitializer = require("./pubSub");

require("dotenv").config();

async function initialize() {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
  });

  new PubSubInitializer();
}

initialize();

exports.loadCsv = require("./functions/loadCsv");
exports.processPhoneNumbers = require("./functions/processPhoneNumbers");
