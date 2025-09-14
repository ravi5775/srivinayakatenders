const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sri_vinaya_tender',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

console.log('🔧 Database Configuration:');
console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Password: ${dbConfig.password ? '***' : 'NOT SET'}`);

// Create connection pool with error handling
let pool;
try {
  pool = mysql.createPool(dbConfig);
  console.log('📦 MySQL connection pool created');
} catch (error) {
  console.error('❌ Failed to create MySQL connection pool:', error.message);
  process.exit(1);
}

// Enhanced test connection with detailed error reporting
const testConnection = async () => {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test basic connection
    const connection = await pool.getConnection();
    console.log('✅ Database connection established successfully');
    
    // Test database exists
    try {
      await connection.query(`USE ${dbConfig.database}`);
      console.log(`✅ Database '${dbConfig.database}' is accessible`);
    } catch (dbError) {
      console.error(`❌ Database '${dbConfig.database}' not found or not accessible:`, dbError.message);
      console.log(`💡 Please create the database using: CREATE DATABASE ${dbConfig.database};`);
    }
    
    // Test if we can query tables
    try {
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`✅ Found ${tables.length} tables in database`);
      if (tables.length === 0) {
        console.log('⚠️  No tables found. Please run the schema.sql file to create tables.');
      }
    } catch (tableError) {
      console.error('❌ Error checking tables:', tableError.message);
    }
    
    connection.release();
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error Code:', error.code);
    console.error('   Error Message:', error.message);
    
    // Provide specific troubleshooting based on error type
    switch (error.code) {
      case 'ECONNREFUSED':
        console.error('💡 MySQL server is not running. Please start MySQL service.');
        console.error('   - Windows: Start MySQL service from Services panel');
        console.error('   - macOS: brew services start mysql');
        console.error('   - Linux: sudo systemctl start mysql');
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        console.error('💡 Access denied. Check username and password.');
        console.error(`   - Current user: ${dbConfig.user}`);
        console.error('   - Try: mysql -u root -p');
        break;
      case 'ENOTFOUND':
        console.error('💡 Host not found. Check database host configuration.');
        break;
      default:
        console.error('💡 Unknown database error. Check MySQL installation and configuration.');
    }
    
    process.exit(1);
  }
};

// Add connection monitoring
pool.on('connection', (connection) => {
  console.log('🔗 New database connection established as id ' + connection.threadId);
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Attempting to reconnect...');
  } else {
    throw err;
  }
});

testConnection();

module.exports = pool;