const db = require('../../backend/utils/dbConfig');

async function addAdmin() {
  try {
    const email = 'admin2@example.com';
    
    await db.query(
      "INSERT INTO admin_whitelist (email, approved_by) VALUES ('admin2@example.com', 'setup')"
    );
    
    console.log('✅ Second admin email added to whitelist:', email);
    
    // Verify it was added
    const result = await db.query('SELECT * FROM admin_whitelist');
    console.log('✅ Current whitelist:', result.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding admin email:', error);
    process.exit(1);
  }
}

addAdmin();