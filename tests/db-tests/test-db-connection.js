const db = require('../../backend/utils/dbConfig');
node tests/db-tests/test-db-connection.js
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing PostgreSQL connection...');
    
    // Test basic connection
    const result = await db.query('SELECT NOW() as time');
    console.log('✅ Database connection successful!');
    console.log('Current database time:', result.rows[0].time);

    // Test tables exist
    console.log('\n📊 Checking database tables...');
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found in the database!');
    } else {
      console.log('✅ Found these tables:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.error('Details:', error.message);
    return false;
  } finally {
    // Close the connection pool
    db.pool.end();
  }
}

testDatabaseConnection();