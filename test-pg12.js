const { Pool } = require('pg');

async function testConnection() {
  // PostgreSQL 12 in WSL typically runs on the default port 5432
  console.log('Testing connection to local PostgreSQL 12...');
  
  const possiblePasswords = ['postgres', '', null, 'postgres12'];
  
  for (const password of possiblePasswords) {
    const config = {
      host: 'localhost',
      port: 5432,  // Default PostgreSQL port
      user: 'postgres',
      database: 'postgres',  // Default database
      password,
      connectionTimeoutMillis: 5000
    };
    
    const pool = new Pool(config);
    
    try {
      console.log(`Trying with password: ${password === null ? 'null' : password === '' ? 'empty' : password}`);
      const client = await pool.connect();
      console.log('✅ Connected successfully!');
      
      // List databases
      const result = await client.query('SELECT datname FROM pg_database');
      console.log('Available databases:');
      result.rows.forEach(row => console.log(`- ${row.datname}`));
      
      client.release();
      await pool.end();
      
      return true;
    } catch (err) {
      console.log(`Failed: ${err.message}`);
      await pool.end().catch(() => {});
    }
  }
  
  console.log('Could not connect to PostgreSQL 12');
  return false;
}

testConnection().catch(console.error);