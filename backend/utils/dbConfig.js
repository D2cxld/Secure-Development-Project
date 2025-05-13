const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'secureblog_roles_v2',
  port: parseInt(process.env.DB_PORT) || 5432
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