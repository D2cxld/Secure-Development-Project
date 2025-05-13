const { Pool } = require('pg');
require('dotenv').config();

async function setup() {
  console.log('🚀 Setting up PostgreSQL for local development...');
  
  // Change connection details to match your env
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres' // Connect to default database first
  };
  
  console.log('Connecting with:', config);
  
  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL!');
    
    // Create database if not exists
    try {
      const dbName = process.env.DB_NAME || 'secureblog_roles_v2';
      const result = await client.query(`
        SELECT 1 FROM pg_database WHERE datname = $1
      `, [dbName]);
      
      if (result.rows.length === 0) {
        console.log(`Creating database: ${dbName}`);
        await client.query(`CREATE DATABASE ${dbName}`);
        console.log('✅ Database created successfully!');
      } else {
        console.log(`Database ${dbName} already exists`);
      }
      
      console.log('✅ Setup successful!');
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

setup();