const { Pool } = require("pg");

let pool;

if (process.env.NODE_ENV === "azure") {
  pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT,
    ssl: { rejectUnauthorized: false }  // ✅ required for Azure PostgreSQL
  });
} else {
  pool = new Pool({
    host: process.env.LOCAL_DB_HOST,
    user: process.env.LOCAL_DB_USER,
    password: process.env.LOCAL_DB_PASSWORD,
    database: process.env.LOCAL_DB_NAME,
    port: process.env.LOCAL_DB_PORT,
  });
}

module.exports = pool;
