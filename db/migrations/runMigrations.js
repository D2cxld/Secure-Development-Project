const fs = require('fs');
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '23Benedict:)',
  database: 'secureblog_roles_v2'
});

const migrationSQL = fs.readFileSync('./db/migrations/001_create_user_login.sql', 'utf-8');

connection.connect();
connection.query(migrationSQL, (err, results) => {
  if (err) throw err;
  console.log("✅ Migration applied successfully.");
  connection.end();
});
