# Sri Vinaya Tender - MySQL Database Setup Instructions

## Prerequisites

1. **Install MySQL Server** (Version 8.0 or higher recommended)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or install using package manager:
     ```bash
     # Ubuntu/Debian
     sudo apt update
     sudo apt install mysql-server
     
     # CentOS/RHEL
     sudo yum install mysql-server
     
     # macOS (using Homebrew)
     brew install mysql
     
     # Windows
     # Download and run the MySQL Installer from the official website
     ```

2. **Install MySQL Client Tools**
   ```bash
   # MySQL Workbench (GUI)
   # Download from: https://dev.mysql.com/downloads/workbench/
   
   # Or use command line client (usually included with server)
   mysql --version
   ```

## Step-by-Step Setup

### Step 1: Start MySQL Service

```bash
# Linux
sudo systemctl start mysql
sudo systemctl enable mysql

# macOS
brew services start mysql

# Windows
# Start MySQL service from Services panel or run:
# net start mysql
```

### Step 2: Secure MySQL Installation

```bash
sudo mysql_secure_installation
```

Follow the prompts to:
- Set root password
- Remove anonymous users
- Disable remote root login
- Remove test database
- Reload privilege tables

### Step 3: Login to MySQL

```bash
mysql -u root -p
```

### Step 4: Create Database and User

```sql
-- Create database
CREATE DATABASE sri_vinaya_tender CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user for the application
CREATE USER 'srivinaya_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON sri_vinaya_tender.* TO 'srivinaya_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### Step 5: Execute Database Scripts

Execute the provided SQL files in this exact order:

```bash
# 1. Create schema and tables
mysql -u srivinaya_user -p sri_vinaya_tender < database/schema.sql

# 2. Insert sample data
mysql -u srivinaya_user -p sri_vinaya_tender < database/sample_data.sql

# 3. Create stored procedures
mysql -u srivinaya_user -p sri_vinaya_tender < database/stored_procedures.sql

# 4. Create views
mysql -u srivinaya_user -p sri_vinaya_tender < database/views.sql
```

### Step 6: Verify Installation

```bash
# Login to verify
mysql -u srivinaya_user -p sri_vinaya_tender

# Check tables
SHOW TABLES;

# Check sample data
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM tenders;
SELECT COUNT(*) FROM collections;

# Test a view
SELECT * FROM customer_summary;

# Test a stored procedure
CALL GetDashboardSummary();
```

## Database Connection Details

Use these details to connect your application:

```
Host: localhost
Port: 3306
Database: sri_vinaya_tender
Username: srivinaya_user
Password: your_secure_password
```

## Configuration for Different Environments

### Development Environment
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sri_vinaya_tender
DB_USER=srivinaya_user
DB_PASS=your_secure_password
```

### Production Environment
- Use strong passwords
- Enable SSL connections
- Configure proper firewall rules
- Regular backups
- Monitor performance

## Backup and Restore

### Create Backup
```bash
mysqldump -u srivinaya_user -p sri_vinaya_tender > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup
```bash
mysql -u srivinaya_user -p sri_vinaya_tender < backup_file.sql
```

## Performance Optimization

### Recommended MySQL Configuration (my.cnf)
```ini
[mysqld]
# Basic Settings
default_storage_engine = InnoDB
character_set_server = utf8mb4
collation_server = utf8mb4_unicode_ci

# Performance Settings
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
query_cache_type = 1
query_cache_size = 256M

# Connection Settings
max_connections = 200
max_connect_errors = 1000
```

## Troubleshooting

### Common Issues

1. **MySQL Service Not Starting**
   ```bash
   sudo systemctl status mysql
   sudo journalctl -u mysql
   ```

2. **Access Denied Errors**
   - Check username/password
   - Verify user privileges
   - Check if user can connect from specified host

3. **Connection Timeout**
   - Check if MySQL is running on correct port
   - Verify firewall settings
   - Check network connectivity

4. **Character Set Issues**
   - Ensure all tables use utf8mb4
   - Check client connection charset

### Log Files
- Error log: `/var/log/mysql/error.log`
- General log: `/var/log/mysql/mysql.log`
- Slow query log: `/var/log/mysql/slow.log`

## API Integration

To connect your Lovable frontend to this MySQL database, you'll need to:

1. **Deploy a separate backend service** (Node.js, Python, PHP, etc.)
2. **Create REST API endpoints** for CRUD operations
3. **Configure CORS** to allow your Lovable frontend to make requests
4. **Use environment variables** for database connection details

Example backend technologies:
- **Node.js + Express**
- **Python + FastAPI**
- **PHP + Laravel**
- **Java + Spring Boot**

The backend would connect to this MySQL database and expose REST APIs that your Lovable React frontend can consume.

## Security Recommendations

1. **Use strong passwords** for database users
2. **Enable SSL/TLS** for connections
3. **Regular security updates** for MySQL
4. **Backup encryption** for sensitive data
5. **Access logging** and monitoring
6. **Network security** (firewall, VPN)
7. **Regular security audits**

## Maintenance Tasks

### Daily
- Monitor error logs
- Check backup status
- Review slow queries

### Weekly
- Update statistics: `ANALYZE TABLE table_name;`
- Check disk space usage
- Review user connections

### Monthly
- Full database backup
- Security patch updates
- Performance review
- Index optimization