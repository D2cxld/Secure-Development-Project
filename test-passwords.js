const { Pool } = require('pg');

// List of possible passwords to try
const possiblePasswords = [
  'postgres', 
  '23Benedict:)', 
  'admin',
  'password',
  '',
  null
  // Add any other passwords you think it might be
];

// Connection configuration (without password)
const config = {
  host: 'localhost',
  port: 5500,
  user: 'postgres',
  database: 'secureblog_roles_v2',
  // No password set here - we'll try each one
  connectionTimeoutMillis: 3000 // Timeout after 3 seconds if can't connect
};

// Try each password
async function tryPasswords() {
  console.log('Testing possible passwords...');
  
  for (const password of possiblePasswords) {
    const pool = new Pool({
      ...config,
      password
    });
    
    try {
      // Attempt to connect
      const client = await pool.connect();
      console.log(`✅ SUCCESS! Password "${password}" works!`);
      
      // Optional: Execute a simple query to double-check
      const result = await client.query('SELECT current_database()');
      console.log(`Connected to database: ${result.rows[0].current_database}`);
      
      client.release();
      pool.end();
      
      // Exit on first success
      return;
      
    } catch (err) {
      console.log(`❌ Password "${password}" failed: ${err.message}`);
    } finally {
      // Make sure pool is properly ended
      pool.end().catch(() => {});
    }
  }
  
  console.log('None of the passwords worked! 😢');
}

tryPasswords().catch(err => {
  console.error('Unhandled error:', err);
});