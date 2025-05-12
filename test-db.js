const { Pool } = require("pg");
  require("dotenv").config({ path: "./backend/.env" });

  console.log("Database config:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: "***",
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  pool.query("SELECT 1 as test")
    .then(result => {
      console.log("Database connection successful:", result.rows);
      pool.end();
    })
    .catch(err => {
      console.error("Database connection error:", err);
      pool.end();
    });
