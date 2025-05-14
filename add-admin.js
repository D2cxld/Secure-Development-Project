/**
 * Simple script to add an admin to the whitelist
 */
const db = require('./backend/utils/dbConfig');

async function addAdmin() {
  try {
    // Add admin to whitelist
    await db.query(
      'INSERT INTO admin_whitelist (email, approved_by) VALUES ($1, $2)',
      ['admin@example.com', 'system']
    );
    
    console.log('✅ Added admin@example.com to the whitelist');
    
    // Verify
    const result = await db.query('SELECT * FROM admin_whitelist');
    console.log('Current whitelist:', result.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding admin:', error);
    process.exit(1);
  }
}

addAdmin();