const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'secureblog_roles_v2'
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current time from DB:', result.rows[0].now);
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
  }
}

testConnection();