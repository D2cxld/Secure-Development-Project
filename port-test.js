const http = require('http');

  // Try multiple ports
  const ports = [3000, 5500, 8000, 8080];

  ports.forEach(port => {
    console.log(`Testing connection to port ${port}...`);

    const req = http.get(`http://localhost:${port}`, (res) => {
      console.log(`✅ Connected to port ${port} successfully!`);
      console.log(`Status code: ${res.statusCode}`);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Response length: ${data.length} bytes`);
        console.log('Response starts with:', data.substring(0, 100) + '...');
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Error connecting to port ${port}: ${err.message}`);
    });

    // Set a timeout to avoid waiting too long
    req.setTimeout(5000, () => {
      req.destroy();
      console.error(`⏱️ Connection to port ${port} timed out`);
    });
  });

  Run this with node port-test.js to see which ports are actually responding.

  4. Also, check your server.js file again to confirm the exact port configuration:

  // This is what you shared earlier
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server started on port ${PORT}`);
  });