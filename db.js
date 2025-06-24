// === db.js ===
const { Pool } = require('pg');

// Load .env only if not in production
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Helpful log for debugging
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined in environment variables.");
} else {
  console.log("✅ DATABASE_URL found:", process.env.DATABASE_URL);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
