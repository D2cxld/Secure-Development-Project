const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'secureblog_roles_v2',
  port: process.env.DB_PORT || 5432
});

// Read the migration SQL
const migrationSQL = fs.readFileSync(
  path.join(__dirname, '001_create_postgres_tables.sql'), 
  'utf-8'
).replace(/\r/g, '');

async function runMigration() {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(migrationSQL);
      await client.query('COMMIT');
      console.log('✅ PostgreSQL migration completed successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Migration failed:', err.message);
      throw err;
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  }
}

runMigration();