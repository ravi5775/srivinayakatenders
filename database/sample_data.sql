-- ===========================================
-- Sri Vinaya Tender - Sample Data
-- ===========================================

USE sri_vinaya_tender;

-- ===========================================
-- Insert Sample Customers
-- ===========================================
INSERT INTO customers (name, phone, email, address) VALUES
('SatyaSai', '9959610817', 'satya@example.com', 'Hyderabad, Telangana'),
('Reeshma', '7330940336', 'reeshma@example.com', 'Vijayawada, Andhra Pradesh'),
('Rishi', '9133651512', 'rishi@example.com', 'Warangal, Telangana'),
('Mohan', '8106754515', 'mohan@example.com', 'Guntur, Andhra Pradesh');

-- ===========================================
-- Insert Sample Tenders
-- ===========================================
INSERT INTO tenders (
    customer_id, tender_name, plan_type, installment_type, 
    installment_amount, total_amount, total_installments, 
    remaining_amount, remaining_installments, start_date, 
    end_date, next_due_date
) VALUES
(1, 'Tender Plan A', 'DailyPlan', 'Daily', 111.11, 8800.00, 80, 8800.00, 80, '2025-01-01', '2025-03-21', '2025-01-01'),
(2, 'Tender Plan B', 'MonthlyPlan', 'Monthly', 5500.00, 44000.00, 8, 44000.00, 8, '2025-01-01', '2025-08-01', '2025-02-01'),
(3, 'Tender Plan C', 'DailyPlan', 'Daily', 91.67, 5500.00, 60, 5500.00, 60, '2025-01-01', '2025-03-01', '2025-01-01'),
(4, 'Tender Plan D', 'DailyPlan', 'Daily', 111.11, 9900.00, 89, 9900.00, 89, '2025-01-01', '2025-03-30', '2025-01-01');

-- ===========================================
-- Insert Sample Collections
-- ===========================================
INSERT INTO collections (
    tender_id, customer_id, collected_amount, installments_covered,
    collection_date, payment_method, notes
) VALUES
(1, 1, 111.11, 1, '2025-01-01', 'Cash', 'First payment received'),
(1, 1, 111.11, 1, '2025-01-02', 'Cash', 'Second payment received'),
(2, 2, 5500.00, 1, '2025-01-01', 'Bank Transfer', 'Monthly payment received'),
(3, 3, 91.67, 1, '2025-01-01', 'UPI', 'Payment via UPI'),
(4, 4, 111.11, 1, '2025-01-01', 'Cash', 'Initial payment');

-- ===========================================
-- Update Tender Calculations After Collections
-- ===========================================
UPDATE tenders t SET 
    paid_installments = (
        SELECT COALESCE(SUM(installments_covered), 0) 
        FROM collections c 
        WHERE c.tender_id = t.id
    ),
    collected_amount = (
        SELECT COALESCE(SUM(collected_amount), 0) 
        FROM collections c 
        WHERE c.tender_id = t.id
    ),
    remaining_amount = total_amount - (
        SELECT COALESCE(SUM(collected_amount), 0) 
        FROM collections c 
        WHERE c.tender_id = t.id
    ),
    remaining_installments = total_installments - (
        SELECT COALESCE(SUM(installments_covered), 0) 
        FROM collections c 
        WHERE c.tender_id = t.id
    );

-- ===========================================
-- Insert Default Settings
-- ===========================================
INSERT INTO settings (setting_key, setting_value, description) VALUES
('company_name', 'Sri Vinaya Tender', 'Company name for reports'),
('default_currency', 'INR', 'Default currency symbol'),
('financial_year_start', '04-01', 'Financial year start (MM-DD)'),
('overdue_grace_days', '3', 'Grace days before marking overdue'),
('auto_calculate_due_dates', 'true', 'Auto calculate next due dates'),
('backup_retention_days', '30', 'Days to retain backup files'),
('notification_reminder_days', '1', 'Days before due date to send reminder');