const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'secureblog_roles_v2'
});

async function checkUsers() {
  try {
    const client = await pool.connect();
    
    console.log('\n=== User Login Table ===');
    const loginResult = await client.query('SELECT id, username, email, role, created_at FROM user_login ORDER BY created_at DESC');
    loginResult.rows.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}, Created: ${user.created_at}`);
    });
    
    console.log('\n=== User Profile Table ===');
    const profileResult = await client.query('SELECT id, username, first_name, surname, created_at FROM user_profile ORDER BY created_at DESC');
    profileResult.rows.forEach(profile => {
      console.log(`ID: ${profile.id}, Username: ${profile.username}, Name: ${profile.first_name} ${profile.surname}, Created: ${profile.created_at}`);
    });
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Error querying database:', err);
  }
}

checkUsers();