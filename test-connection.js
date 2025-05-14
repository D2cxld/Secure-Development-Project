/**
 * Simple connection test script
 *
 * This script tests the basic connection to the server without doing any complex operations.
 */

const http = require('http');

// Test connection to the server
function testConnection() {
  console.log('Testing connection to http://localhost:5500...');

  const options = {
    host: 'localhost',
    port: 5500,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server responded with status code: ${res.statusCode}`);
    console.log(`✅ Headers: ${JSON.stringify(res.headers)}`);

    res.on('data', (chunk) => {
      console.log(`Body preview: ${chunk.toString().substring(0, 100)}...`);
    });

    res.on('end', () => {
      console.log('Response complete');
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Error connecting to server: ${e.message}`);
    console.error(`❌ Error code: ${e.code}`);

    if (e.code === 'ECONNREFUSED') {
      console.error('⚠️ Connection refused. Make sure the server is running on port 5500.');
    } else if (e.code === 'ECONNRESET') {
      console.error('⚠️ Connection reset. The server might be overloaded or not properly configured.');
    }
  });

  req.on('timeout', () => {
    console.error('❌ Request timed out');
    req.destroy();
  });

  req.end();
}

testConnection();