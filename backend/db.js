// db.js
const mysql = require("mysql2/promise"); // Use promise-based API
require("dotenv").config();

async function getDBConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      port: process.env.DB_PORT, 
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    return connection;
  } catch (err) {
    console.error("❌ MySQL connection error:", err);
    throw err;
  }
}

module.exports = getDBConnection;
