const { Pool, Client } = require('pg');
const net = require('net');

// List of possible passwords to try
const possiblePasswords = [
  'postgres', 
  '23Benedict:)', 
  'admin',
  'password',
  '',
  null,
  'Benedict',
  '23Benedict',
  'postgres23'
];

// Connection configuration
const config = {
  host: 'localhost',
  port: 5500,
  user: 'postgres',
  database: 'secureblog_roles_v2',
  connectionTimeoutMillis: 5000 // Timeout after 5 seconds
};

// First check if port is open
async function checkPort() {
  return new Promise((resolve) => {
    console.log(`Testing if port ${config.port} is open...`);
    
    const socket = new net.Socket();
    const onError = () => {
      console.error(`❌ Port ${config.port} is NOT accessible!`);
      socket.destroy();
      resolve(false);
    };
    
    socket.setTimeout(2000); // 2 second timeout
    socket.on('timeout', onError);
    socket.on('error', onError);
    
    socket.connect(config.port, config.host, () => {
      console.log(`✅ Port ${config.port} is open and accessible`);
      socket.destroy();
      resolve(true);
    });
  });
}

// Try using libpq environment variables (how psql connects)
async function tryEnvironmentConnection() {
  console.log('\nTrying connection using environment variables...');
  
  // Set environment variables (like psql uses)
  process.env.PGHOST = config.host;
  process.env.PGPORT = config.port;
  process.env.PGUSER = config.user;
  process.env.PGDATABASE = config.database;
  
  const client = new Client(); // Uses env vars by default
  
  try {
    await client.connect();
    console.log('✅ Connected using environment variables!');
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ Failed using environment variables: ${err.message}`);
    return false;
  }
}

// Try accessing postgres database (not the target db)
async function tryPostgresDatabase() {
  console.log('\nTrying connection to postgres database instead...');
  
  // Try default postgres database
  const testConfig = {
    ...config,
    database: 'postgres',
    password: possiblePasswords[0] // Try with first password
  };
  
  const pool = new Pool(testConfig);
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to postgres database!');
    
    // List available databases
    const result = await client.query(`
      SELECT datname FROM pg_database 
      WHERE datistemplate = false
      ORDER BY datname
    `);
    
    console.log('Available databases:');
    result.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.datname}`);
    });
    
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.log(`❌ Failed connecting to postgres database: ${err.message}`);
    await pool.end().catch(() => {});
    return false;
  }
}

// Try different users
async function tryDifferentUsers() {
  console.log('\nTrying different PostgreSQL users...');
  const users = ['postgres', 'pgadmin'];
  
  for (const user of users) {
    const testConfig = {
      ...config,
      user,
      password: possiblePasswords[0] // Try with first password
    };
    
    const pool = new Pool(testConfig);
    
    try {
      console.log(`Trying user: ${user}`);
      const client = await pool.connect();
      console.log(`✅ User "${user}" works!`);
      client.release();
      await pool.end();
    } catch (err) {
      console.log(`❌ User "${user}" failed: ${err.message}`);
      await pool.end().catch(() => {});
    }
  }
}

// Try each password with the target database
async function tryPasswords() {
  console.log('\nTesting possible passwords on secureblog_roles_v2...');
  
  for (const password of possiblePasswords) {
    const passwordDisplay = password === '' ? '(empty string)' : 
                           password === null ? '(null)' : 
                           `"${password}"`;
    
    console.log(`Trying password: ${passwordDisplay}`);
    
    const pool = new Pool({
      ...config,
      password
    });
    
    try {
      // Attempt to connect
      const client = await pool.connect();
      console.log(`✅ SUCCESS! Password ${passwordDisplay} works!`);
      
      // Execute a simple query to double-check
      const result = await client.query('SELECT current_database()');
      console.log(`Connected to database: ${result.rows[0].current_database}`);
      
      client.release();
      await pool.end();
      
      // Exit on first success
      return true;
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
      await pool.end().catch(() => {});
    }
  }
  
  console.log('None of the passwords worked! 😢');
  return false;
}

// Main function
async function testConnection() {
  console.log('=== PostgreSQL Connection Diagnostic ===');
  console.log('Connection details:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Database: ${config.database}`);
  
  // Check port first
  const portOpen = await checkPort();
  if (!portOpen) {
    console.log('\n❌ Cannot proceed: PostgreSQL port is not accessible');
    return;
  }
  
  // Try with environment variables (how psql connects)
  await tryEnvironmentConnection();
  
  // Try postgres database
  await tryPostgresDatabase();
  
  // Try different users
  await tryDifferentUsers();
  
  // Try passwords
  await tryPasswords();
  
  console.log('\n=== Diagnostic Complete ===');
  console.log('Suggestions:');
  console.log('1. Check actual pgAdmin connection settings');
  console.log('2. Try resetting PostgreSQL password');
  console.log('3. Try more password combinations');
}

testConnection().catch(err => {
  console.error('Unhandled error:', err);
});