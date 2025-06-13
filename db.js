// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Manoj1234',
  port: 5432,
  ssl: false // ❗ Disable SSL for local PostgreSQL
});

module.exports = pool;

