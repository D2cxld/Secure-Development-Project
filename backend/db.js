const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'blogsdb',
  password: 'Nightcrawler007',
  port: 5434, // default Postgres port
});

module.exports = pool;
