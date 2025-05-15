  const express = require('express');
  const path = require('path');
  const app = express();

  // Serve static files
  app.use(express.static(path.join(__dirname, 'Front-end')));

  // Root route
  app.get('/', (req, res) => {
    res.send('<h1>Hello from Express!</h1><p><a href="/register.html">Register</a></p>');
  });

  // Start server
  const PORT = 9000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log();
  });

