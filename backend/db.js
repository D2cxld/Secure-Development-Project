const { Pool } = require('pg');

const pool = new Pool({
  user: 'root',
  host: 'localhost',
  database: 'blogsdb',
  password: 'Nightcrawler007',
  port: 5432, // default Postgres port
});

module.exports = pool;
