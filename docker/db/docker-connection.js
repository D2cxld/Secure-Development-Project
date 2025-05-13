const { Pool } = require('pg');

// Use environment variables with Docker-compatible defaults
const pool = new Pool({
  host: process.env.DB_HOST || 'db', // Note: 'db' is the Docker service name
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'secureblog_roles_v2'
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool
};