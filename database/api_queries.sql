-- ===========================================
-- Sri Vinaya Tender - API Query Examples
-- ===========================================

USE sri_vinaya_tender;

-- ===========================================
-- CUSTOMER OPERATIONS
-- ===========================================

-- Get all customers with summary
SELECT * FROM customer_summary ORDER BY name;

-- Get specific customer details
SELECT 
    c.*,
    COUNT(t.id) as total_tenders,
    SUM(t.total_amount) as total_given,
    SUM(t.collected_amount) as total_collected,
    SUM(t.remaining_amount) as outstanding
FROM customers c
LEFT JOIN tenders t ON c.id = t.customer_id
WHERE c.id = ?
GROUP BY c.id;

-- Search customers
SELECT * FROM customers 
WHERE name LIKE CONCAT('%', ?, '%') 
   OR phone LIKE CONCAT('%', ?, '%')
   OR email LIKE CONCAT('%', ?, '%')
ORDER BY name;

-- Add new customer
INSERT INTO customers (name, phone, email, address)
VALUES (?, ?, ?, ?);

-- Update customer
UPDATE customers 
SET name = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- Delete customer (soft delete)
UPDATE customers SET status = 'INACTIVE' WHERE id = ?;

-- ===========================================
-- TENDER OPERATIONS
-- ===========================================

-- Get all tenders with details
SELECT * FROM tender_details ORDER BY created_at DESC;

-- Get tenders for specific customer
SELECT * FROM tender_details WHERE customer_name = ? ORDER BY created_at DESC;

-- Get active tenders
SELECT * FROM tender_details WHERE status = 'ACTIVE' ORDER BY next_due_date;

-- Get overdue tenders
SELECT * FROM tender_details 
WHERE status = 'OVERDUE' OR (status = 'ACTIVE' AND next_due_date < CURDATE())
ORDER BY days_overdue DESC;

-- Add new tender
INSERT INTO tenders (
    customer_id, tender_name, plan_type, installment_type,
    installment_amount, total_amount, total_installments,
    remaining_amount, remaining_installments, start_date, 
    end_date, next_due_date
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- Update tender
UPDATE tenders 
SET tender_name = ?, plan_type = ?, installment_type = ?,
    installment_amount = ?, total_amount = ?, total_installments = ?,
    remaining_amount = ?, remaining_installments = ?, 
    end_date = ?, next_due_date = ?, notes = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- ===========================================
-- COLLECTION OPERATIONS
-- ===========================================

-- Get all collections
SELECT * FROM collection_history ORDER BY collection_date DESC;

-- Get collections for specific tender
SELECT * FROM collection_history WHERE tender_name = ? ORDER BY collection_date DESC;

-- Get collections for specific customer
SELECT * FROM collection_history WHERE customer_name = ? ORDER BY collection_date DESC;

-- Get collections for date range
SELECT * FROM collection_history 
WHERE collection_date BETWEEN ? AND ?
ORDER BY collection_date DESC;

-- Add new collection (use stored procedure)
CALL AddCollection(?, ?, ?, ?, ?, ?, ?);

-- Get daily collection summary
SELECT * FROM daily_collection_summary 
WHERE collection_date BETWEEN ? AND ?
ORDER BY collection_date DESC;

-- ===========================================
-- DASHBOARD QUERIES
-- ===========================================

-- Get dashboard summary
CALL GetDashboardSummary();

-- Get monthly collection trend (last 6 months)
SELECT 
    YEAR(collection_date) as year,
    MONTH(collection_date) as month,
    MONTHNAME(collection_date) as month_name,
    SUM(collected_amount) as total_collected,
    COUNT(*) as total_transactions
FROM collections
WHERE collection_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
GROUP BY YEAR(collection_date), MONTH(collection_date)
ORDER BY year DESC, month DESC;

-- Get portfolio distribution by plan type
SELECT 
    plan_type,
    COUNT(*) as tender_count,
    SUM(total_amount) as total_amount,
    SUM(collected_amount) as collected_amount,
    SUM(remaining_amount) as remaining_amount,
    AVG(installment_amount) as avg_installment
FROM tenders
GROUP BY plan_type;

-- Get top customers by outstanding amount
SELECT 
    c.name,
    c.phone,
    COUNT(t.id) as tender_count,
    SUM(t.total_amount) as total_given,
    SUM(t.collected_amount) as total_collected,
    SUM(t.remaining_amount) as outstanding
FROM customers c
JOIN tenders t ON c.id = t.customer_id
WHERE t.status IN ('ACTIVE', 'OVERDUE')
GROUP BY c.id, c.name, c.phone
ORDER BY outstanding DESC
LIMIT 10;

-- ===========================================
-- REPORTS QUERIES
-- ===========================================

-- Monthly collection report
CALL GetMonthlyCollectionReport(?, ?);

-- Overdue report
CALL GetOverdueTenders();

-- Customer performance report
SELECT * FROM customer_risk_assessment ORDER BY risk_level DESC, total_outstanding DESC;

-- Plan type performance
SELECT * FROM performance_metrics ORDER BY completion_rate DESC;

-- Collection method analysis
SELECT 
    payment_method,
    COUNT(*) as transaction_count,
    SUM(collected_amount) as total_amount,
    AVG(collected_amount) as avg_amount,
    (SUM(collected_amount) / (SELECT SUM(collected_amount) FROM collections)) * 100 as percentage
FROM collections
GROUP BY payment_method
ORDER BY total_amount DESC;

-- ===========================================
-- ANALYTICS QUERIES
-- ===========================================

-- Weekly collection pattern
SELECT 
    DAYNAME(collection_date) as day_name,
    DAYOFWEEK(collection_date) as day_number,
    COUNT(*) as transaction_count,
    SUM(collected_amount) as total_amount,
    AVG(collected_amount) as avg_amount
FROM collections
GROUP BY DAYNAME(collection_date), DAYOFWEEK(collection_date)
ORDER BY day_number;

-- Monthly portfolio summary
SELECT * FROM monthly_portfolio_summary ORDER BY year DESC, month DESC;

-- Completion rate by installment type
SELECT 
    installment_type,
    COUNT(*) as total_tenders,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
    ROUND((COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) / COUNT(*)) * 100, 2) as completion_rate,
    AVG(CASE WHEN status = 'COMPLETED' THEN 
        DATEDIFF(
            (SELECT MAX(collection_date) FROM collections WHERE tender_id = tenders.id),
            start_date
        ) 
    END) as avg_completion_days
FROM tenders
GROUP BY installment_type;

-- Customer lifecycle analysis
SELECT 
    c.id,
    c.name,
    c.created_at as customer_since,
    DATEDIFF(CURDATE(), c.created_at) as days_as_customer,
    COUNT(t.id) as total_tenders,
    MIN(t.start_date) as first_tender_date,
    MAX(t.start_date) as last_tender_date,
    SUM(t.total_amount) as lifetime_value,
    SUM(t.collected_amount) as total_collected,
    CASE 
        WHEN COUNT(CASE WHEN t.status = 'ACTIVE' THEN 1 END) > 0 THEN 'ACTIVE'
        WHEN COUNT(CASE WHEN t.status = 'OVERDUE' THEN 1 END) > 0 THEN 'AT_RISK'
        ELSE 'INACTIVE'
    END as customer_status
FROM customers c
LEFT JOIN tenders t ON c.id = t.customer_id
GROUP BY c.id, c.name, c.created_at
ORDER BY lifetime_value DESC;

-- ===========================================
-- SEARCH AND FILTER QUERIES
-- ===========================================

-- Advanced customer search
SELECT c.*, cs.total_tenders, cs.total_outstanding
FROM customers c
LEFT JOIN customer_summary cs ON c.id = cs.id
WHERE (? IS NULL OR c.name LIKE CONCAT('%', ?, '%'))
  AND (? IS NULL OR c.phone LIKE CONCAT('%', ?, '%'))
  AND (? IS NULL OR c.status = ?)
  AND (? IS NULL OR cs.total_outstanding >= ?)
  AND (? IS NULL OR cs.total_outstanding <= ?)
ORDER BY c.name;

-- Advanced tender search
SELECT td.*
FROM tender_details td
WHERE (? IS NULL OR td.customer_name LIKE CONCAT('%', ?, '%'))
  AND (? IS NULL OR td.tender_name LIKE CONCAT('%', ?, '%'))
  AND (? IS NULL OR td.status = ?)
  AND (? IS NULL OR td.plan_type = ?)
  AND (? IS NULL OR td.installment_type = ?)
  AND (? IS NULL OR td.next_due_date >= ?)
  AND (? IS NULL OR td.next_due_date <= ?)
ORDER BY td.next_due_date;

-- Advanced collection search
SELECT ch.*
FROM collection_history ch
WHERE (? IS NULL OR ch.customer_name LIKE CONCAT('%', ?, '%'))
  AND (? IS NULL OR ch.tender_name LIKE CONCAT('%', ?, '%'))
  AND (? IS NULL OR ch.payment_method = ?)
  AND (? IS NULL OR ch.collection_date >= ?)
  AND (? IS NULL OR ch.collection_date <= ?)
  AND (? IS NULL OR ch.collected_amount >= ?)
  AND (? IS NULL OR ch.collected_amount <= ?)
ORDER BY ch.collection_date DESC;