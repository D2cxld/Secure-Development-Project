const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'secureblog_roles_v2',
  port: process.env.DB_PORT || 5432
});

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    return;
  }
  console.log('✅ PostgreSQL connected successfully!');
  release();
});

// Export a query function
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};