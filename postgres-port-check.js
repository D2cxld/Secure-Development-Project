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

// List of ports to try
const portsToTry = [5500, 5432, 5433];

// Base connection configuration
const baseConfig = {
  host: 'localhost',
  user: 'postgres',
  database: 'secureblog_roles_v2',
  connectionTimeoutMillis: 5000
};

// Check if port is open
async function checkPort(port) {
  return new Promise((resolve) => {
    console.log(`Testing if port ${port} is open...`);
    
    const socket = new net.Socket();
    const onError = () => {
      console.error(`❌ Port ${port} is NOT accessible!`);
      socket.destroy();
      resolve(false);
    };
    
    socket.setTimeout(2000); // 2 second timeout
    socket.on('timeout', onError);
    socket.on('error', onError);
    
    socket.connect(port, baseConfig.host, () => {
      console.log(`✅ Port ${port} is open and accessible`);
      socket.destroy();
      resolve(true);
    });
  });
}

// Try connecting to each port
async function tryPorts() {
  console.log('\n=== Testing Different PostgreSQL Ports ===');
  
  for (const port of portsToTry) {
    console.log(`\n--- Testing Port ${port} ---`);
    
    // Check if port is open first
    const portOpen = await checkPort(port);
    if (!portOpen) {
      console.log(`Skipping port ${port} as it's not open`);
      continue;
    }
    
    // Try each password on this port
    await tryPortWithPasswords(port);
  }
}

// Try each password with a specific port
async function tryPortWithPasswords(port) {
  console.log(`\nTesting possible passwords on port ${port}...`);
  
  for (const password of possiblePasswords) {
    const passwordDisplay = password === '' ? '(empty string)' : 
                           password === null ? '(null)' : 
                           `"${password}"`;
    
    console.log(`Trying port ${port} with password: ${passwordDisplay}`);
    
    const config = {
      ...baseConfig,
      port,
      password
    };
    
    const pool = new Pool(config);
    
    try {
      // Attempt to connect
      const client = await pool.connect();
      console.log(`✅ SUCCESS! Port ${port} with password ${passwordDisplay} works!`);
      
      // Execute a simple query to double-check
      const result = await client.query('SELECT current_database()');
      console.log(`Connected to database: ${result.rows[0].current_database}`);
      
      // List available databases
      try {
        const dbResult = await client.query(`
          SELECT datname FROM pg_database 
          WHERE datistemplate = false
          ORDER BY datname
        `);
        
        console.log('Available databases:');
        dbResult.rows.forEach((row, i) => {
          console.log(`  ${i+1}. ${row.datname}`);
        });
      } catch (err) {
        console.log('Unable to list databases:', err.message);
      }
      
      client.release();
      await pool.end();
      
      return true;
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
      await pool.end().catch(() => {});
    }
  }
  
  console.log(`None of the passwords worked on port ${port}!`);
  return false;
}

// Try connecting to postgres database instead
async function tryPostgresDatabase() {
  console.log('\n=== Testing Connection to Default postgres Database ===');
  
  for (const port of portsToTry) {
    const portOpen = await checkPort(port);
    if (!portOpen) continue;
    
    console.log(`\nTrying postgres database on port ${port}...`);
    
    for (const password of possiblePasswords) {
      const passwordDisplay = password === '' ? '(empty string)' : 
                             password === null ? '(null)' : 
                             `"${password}"`;
      
      console.log(`Trying postgres database with port ${port}, password: ${passwordDisplay}`);
      
      const config = {
        ...baseConfig,
        port,
        database: 'postgres',
        password
      };
      
      const pool = new Pool(config);
      
      try {
        const client = await pool.connect();
        console.log(`✅ SUCCESS! Connected to postgres database on port ${port} with password ${passwordDisplay}`);
        
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
        await pool.end().catch(() => {});
      }
    }
  }
  
  console.log('❌ Could not connect to postgres database on any port with any password!');
  return false;
}

// Main function
async function testConnection() {
  console.log('=== PostgreSQL Connection Diagnostic ===');
  console.log('Base connection details:');
  console.log(`  Host: ${baseConfig.host}`);
  console.log(`  User: ${baseConfig.user}`);
  console.log(`  Database: ${baseConfig.database}`);
  console.log(`  Ports to try: ${portsToTry.join(', ')}`);
  
  // Try each port with passwords
  await tryPorts();
  
  // Try postgres database
  await tryPostgresDatabase();
  
  console.log('\n=== Diagnostic Complete ===');
  console.log('Suggestions:');
  console.log('1. Check actual pgAdmin connection settings');
  console.log('2. Try resetting PostgreSQL password');
  console.log('3. If a connection succeeded, update your .env file with the correct settings');
}

testConnection().catch(err => {
  console.error('Unhandled error:', err);
});