import mysql, { RowDataPacket } from 'mysql2/promise';
import { config } from '../config';

export const db = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
});

db.on('connection', (connection) => {
  connection.on('error', (err) => {
    console.error('❌ MySQL Connection Error:', err);
  });
});

export async function checkDatabaseConnection() {
  try {
    console.log('🔄 Attempting to connect to MySQL...');
    console.log(`   Host: ${config.db.host}`);
    console.log(`   Port: ${config.db.port}`);
    console.log(`   Database: ${config.db.database}`);
    console.log(`   User: ${config.db.user}`);

    await db.query('SELECT 1');
    console.log('✅ Connected to MySQL');
    return true;
  } catch (err: any) {
    console.error('❌ MySQL Connection Failed:', err);
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Verify the database server is running');
    console.error('   2. Check if the IP/host is correct in your .env file');
    console.error(
      `   3. Ensure port ${config.db.port} is not blocked by firewall`,
    );
    console.error('   4. Verify database credentials are correct');
    console.error(
      '   5. If using a remote database, check network connectivity',
    );
    console.error('');
    console.error(
      '⚠️  Bot will continue running, but database features will not work.',
    );
    return false;
  }
}
