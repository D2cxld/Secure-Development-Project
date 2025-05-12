const db = require("./backend/utils/dbConfig");

async function listTables() {
  try {
    const tables = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log("✅ Database tables:");
    tables.rows.forEach(row => {
      console.log("- " + row.table_name);
    });
    
    // Check admin whitelist
    const admins = await db.query("SELECT * FROM admin_whitelist");
    console.log("\n✅ Admin whitelist:");
    console.log(admins.rows);
    
    // Check user_login
    const users = await db.query("SELECT username, email, role, uses_2fa FROM user_login");
    console.log("\n✅ Registered users:");
    console.log(users.rows);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Database error:", error);
    process.exit(1);
  }
}

listTables();