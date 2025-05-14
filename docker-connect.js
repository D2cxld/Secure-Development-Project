const http = require('http');

  console.log('Testing connection to Docker container on port 5500...');

  const req = http.get('http://localhost:5500', (res) => {
    console.log('✅ Connected successfully!');
    console.log('Status code:', res.statusCode);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response received! Length:', data.length, 'bytes');
      // Just print the first 100 characters to avoid overwhelming the console
      console.log('Response preview:', data.substring(0, 100) + '...');
    });
  });

  req.on('error', (err) => {
    console.error('❌ Connection error:', err.message);
    console.error('Error code:', err.code);

    if (err.code === 'ECONNREFUSED') {
      console.error('The Docker container might not be running or the port mapping is incorrect.');
    } else if (err.code === 'ECONNRESET') {
      console.error('The connection was reset. This can happen if the server is overloaded.');
    }
  });

  // Set a timeout
  req.setTimeout(5000, () => {
    console.error('⏱️ Request timed out after 5 seconds');
    req.destroy();
  });