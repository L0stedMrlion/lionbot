import db from '../utils/db';

export async function checkDatabaseConnection() {
  try {
    console.log('🔄 Attempting to connect to MySQL...');
    console.log(`   Host: ${process.env.IP || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || '3306'}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);

    await db.query('SELECT 1');
    console.log('✅ Connected to MySQL');
  } catch (err: any) {
    console.error('❌ MySQL Connection Failed:', err);
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Verify the database server is running');
    console.error('   2. Check if the IP/host is correct in your .env file');
    console.error(
      '   3. Ensure port 3306 (or your custom port) is not blocked by firewall',
    );
    console.error('   4. Verify database credentials are correct');
    console.error(
      '   5. If using a remote database, check network connectivity',
    );
    console.error('');
    console.error(
      '⚠️  Bot will continue running, but database features will not work.',
    );
  }
}
