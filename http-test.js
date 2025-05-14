const http = require('http');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  };

  console.log('Testing connection to http://localhost:3000...');

  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`Response length: ${data.length} bytes`);
      console.log('Connection test SUCCESSFUL');
    });
  });

  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
    if (e.code === 'ECONNREFUSED') {
      console.error('The server might not be running or is not listening on this port.');
    }
  });

  req.end();
  