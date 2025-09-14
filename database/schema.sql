-- ===========================================
-- Sri Vinaya Tender - MySQL Database Schema
-- ===========================================

-- Create Database
CREATE DATABASE IF NOT EXISTS sri_vinaya_tender 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE sri_vinaya_tender;

-- ===========================================
-- 1. Customers Table
-- ===========================================
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    INDEX idx_customer_phone (phone),
    INDEX idx_customer_name (name)
);

-- ===========================================
-- 2. Tenders Table
-- ===========================================
CREATE TABLE tenders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    tender_name VARCHAR(255) NOT NULL,
    plan_type ENUM('DailyPlan', 'WeeklyPlan', 'MonthlyPlan') NOT NULL,
    installment_type ENUM('Daily', 'Weekly', 'Monthly') NOT NULL,
    installment_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    total_installments INT NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    remaining_installments INT NOT NULL,
    paid_installments INT DEFAULT 0,
    collected_amount DECIMAL(10,2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE,
    status ENUM('ACTIVE', 'COMPLETED', 'OVERDUE', 'SUSPENDED') DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_tender_customer (customer_id),
    INDEX idx_tender_status (status),
    INDEX idx_tender_next_due (next_due_date)
);

-- ===========================================
-- 3. Collections Table
-- ===========================================
CREATE TABLE collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tender_id INT NOT NULL,
    customer_id INT NOT NULL,
    collected_amount DECIMAL(10,2) NOT NULL,
    installments_covered INT DEFAULT 1,
    collection_date DATE NOT NULL,
    payment_method ENUM('Cash', 'Bank Transfer', 'UPI', 'Cheque') DEFAULT 'Cash',
    receipt_number VARCHAR(50),
    notes TEXT,
    collected_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_collection_tender (tender_id),
    INDEX idx_collection_customer (customer_id),
    INDEX idx_collection_date (collection_date)
);

-- ===========================================
-- 4. Settings Table
-- ===========================================
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
);

-- ===========================================
-- 5. Audit Log Table
-- ===========================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    user_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_table_record (table_name, record_id),
    INDEX idx_audit_created (created_at)
);

-- ===========================================
-- 6. File Attachments Table
-- ===========================================
CREATE TABLE file_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('customer', 'tender', 'collection') NOT NULL,
    entity_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    file_type VARCHAR(100),
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attachment_entity (entity_type, entity_id)
);