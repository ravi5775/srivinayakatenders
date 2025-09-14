# Sri Vinaya Tender Backend Setup Guide

## Overview
Complete MySQL backend setup for Sri Vinaya Tender management system.

## Prerequisites
- MySQL Server 8.0+
- Node.js 18+ (for API server)
- Git

## Step 1: Install MySQL

### Windows
1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Run installer and select "Server only" or "Developer Default"
3. Set root password during installation
4. Complete installation and start MySQL service

### macOS
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

### Ubuntu/Linux
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

## Step 2: Database Setup

1. **Login to MySQL as root:**
```bash
mysql -u root -p
```

2. **Create database and user:**
```sql
CREATE DATABASE sri_vinaya_tender CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'srivinaya_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON sri_vinaya_tender.* TO 'srivinaya_user'@'localhost';
FLUSH PRIVILEGES;
USE sri_vinaya_tender;
```

3. **Import database files in this order:**
```bash
# From the backend directory
mysql -u srivinaya_user -p sri_vinaya_tender < database/schema.sql
mysql -u srivinaya_user -p sri_vinaya_tender < database/sample_data.sql
mysql -u srivinaya_user -p sri_vinaya_tender < database/stored_procedures.sql
mysql -u srivinaya_user -p sri_vinaya_tender < database/views.sql
```

## Step 3: Environment Configuration

Create `.env` file in the backend directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sri_vinaya_tender
DB_USER=srivinaya_user
DB_PASSWORD=your_secure_password

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here
```

## Step 4: Install Dependencies

```bash
cd backend
npm install
```

## Step 5: Start the Backend Server

```bash
npm run dev
```

Server will run on http://localhost:3000

## Step 6: Frontend Configuration

Update your frontend to connect to the local backend:
1. Update Supabase client configuration to point to local API
2. Update all API endpoints to use http://localhost:3000

## API Endpoints

- `GET /api/customers` - Get all customers
- `POST /api/customers` - Add new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/tenders` - Get all tenders
- `POST /api/tenders` - Add new tender
- `GET /api/collections` - Get all collections
- `POST /api/collections` - Record payment
- `GET /api/dashboard/stats` - Get dashboard statistics

## Verification

1. **Check database tables:**
```sql
USE sri_vinaya_tender;
SHOW TABLES;
SELECT * FROM customers;
```

2. **Test API endpoints:**
```bash
curl http://localhost:3000/api/customers
```

## Troubleshooting

### MySQL Connection Issues
- Ensure MySQL service is running: `sudo systemctl status mysql`
- Check port 3306 is not blocked
- Verify user permissions

### API Server Issues
- Check Node.js version: `node --version`
- Verify all dependencies installed: `npm install`
- Check .env file configuration

## Backup & Restore

### Create Backup
```bash
mysqldump -u srivinaya_user -p sri_vinaya_tender > backup_$(date +%Y%m%d).sql
```

### Restore from Backup
```bash
mysql -u srivinaya_user -p sri_vinaya_tender < backup_20241201.sql
```

## Security Notes

1. Change default passwords
2. Use strong JWT secrets
3. Enable SSL for production
4. Regular database backups
5. Monitor access logs