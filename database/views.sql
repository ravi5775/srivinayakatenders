-- ===========================================
-- Sri Vinaya Tender - Database Views
-- ===========================================

USE sri_vinaya_tender;

-- ===========================================
-- 1. Customer Summary View
-- ===========================================
CREATE OR REPLACE VIEW customer_summary AS
SELECT 
    c.id,
    c.name,
    c.phone,
    c.email,
    c.status,
    COUNT(t.id) as total_tenders,
    COUNT(CASE WHEN t.status = 'ACTIVE' THEN 1 END) as active_tenders,
    COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_tenders,
    COUNT(CASE WHEN t.status = 'OVERDUE' THEN 1 END) as overdue_tenders,
    COALESCE(SUM(t.total_amount), 0) as total_tender_amount,
    COALESCE(SUM(t.collected_amount), 0) as total_collected,
    COALESCE(SUM(t.remaining_amount), 0) as total_outstanding,
    c.created_at
FROM customers c
LEFT JOIN tenders t ON c.id = t.customer_id
GROUP BY c.id, c.name, c.phone, c.email, c.status, c.created_at;

-- ===========================================
-- 2. Tender Details View
-- ===========================================
CREATE OR REPLACE VIEW tender_details AS
SELECT 
    t.id,
    t.tender_name,
    c.name as customer_name,
    c.phone as customer_phone,
    t.plan_type,
    t.installment_type,
    t.installment_amount,
    t.total_amount,
    t.total_installments,
    t.paid_installments,
    t.remaining_installments,
    t.collected_amount,
    t.remaining_amount,
    t.start_date,
    t.end_date,
    t.next_due_date,
    t.status,
    CASE 
        WHEN t.status = 'OVERDUE' THEN DATEDIFF(CURDATE(), t.next_due_date)
        WHEN t.status = 'ACTIVE' AND t.next_due_date < CURDATE() THEN DATEDIFF(CURDATE(), t.next_due_date)
        ELSE 0
    END as days_overdue,
    ROUND((t.collected_amount / t.total_amount) * 100, 2) as completion_percentage,
    t.created_at,
    t.updated_at
FROM tenders t
JOIN customers c ON t.customer_id = c.id;

-- ===========================================
-- 3. Collection History View
-- ===========================================
CREATE OR REPLACE VIEW collection_history AS
SELECT 
    col.id,
    col.collection_date,
    c.name as customer_name,
    c.phone as customer_phone,
    t.tender_name,
    col.collected_amount,
    col.installments_covered,
    col.payment_method,
    col.receipt_number,
    col.notes,
    col.collected_by,
    col.created_at
FROM collections col
JOIN tenders t ON col.tender_id = t.id
JOIN customers c ON col.customer_id = c.id
ORDER BY col.collection_date DESC, col.created_at DESC;

-- ===========================================
-- 4. Daily Collection Summary View
-- ===========================================
CREATE OR REPLACE VIEW daily_collection_summary AS
SELECT 
    collection_date,
    COUNT(*) as total_collections,
    COUNT(DISTINCT customer_id) as unique_customers,
    SUM(collected_amount) as total_amount,
    AVG(collected_amount) as avg_amount,
    SUM(installments_covered) as total_installments_covered,
    GROUP_CONCAT(DISTINCT payment_method) as payment_methods_used
FROM collections
GROUP BY collection_date
ORDER BY collection_date DESC;

-- ===========================================
-- 5. Monthly Portfolio Summary View
-- ===========================================
CREATE OR REPLACE VIEW monthly_portfolio_summary AS
SELECT 
    YEAR(t.start_date) as year,
    MONTH(t.start_date) as month,
    MONTHNAME(t.start_date) as month_name,
    COUNT(*) as tenders_started,
    SUM(t.total_amount) as total_amount_issued,
    COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_tenders,
    COUNT(CASE WHEN t.status = 'ACTIVE' THEN 1 END) as active_tenders,
    COUNT(CASE WHEN t.status = 'OVERDUE' THEN 1 END) as overdue_tenders,
    SUM(t.collected_amount) as total_collected,
    SUM(t.remaining_amount) as total_outstanding
FROM tenders t
GROUP BY YEAR(t.start_date), MONTH(t.start_date), MONTHNAME(t.start_date)
ORDER BY year DESC, month DESC;

-- ===========================================
-- 6. Performance Metrics View
-- ===========================================
CREATE OR REPLACE VIEW performance_metrics AS
SELECT 
    t.installment_type,
    COUNT(*) as total_tenders,
    AVG(t.installment_amount) as avg_installment_amount,
    AVG(t.total_amount) as avg_total_amount,
    AVG(CASE WHEN t.status = 'COMPLETED' THEN 
        DATEDIFF(
            (SELECT MAX(collection_date) FROM collections WHERE tender_id = t.id),
            t.start_date
        ) 
    END) as avg_completion_days,
    SUM(CASE WHEN t.status = 'COMPLETED' THEN t.total_amount ELSE 0 END) as completed_amount,
    SUM(CASE WHEN t.status = 'OVERDUE' THEN t.remaining_amount ELSE 0 END) as overdue_amount,
    ROUND(
        (COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) / COUNT(*)) * 100, 2
    ) as completion_rate
FROM tenders t
GROUP BY t.installment_type;

-- ===========================================
-- 7. Customer Risk Assessment View
-- ===========================================
CREATE OR REPLACE VIEW customer_risk_assessment AS
SELECT 
    c.id,
    c.name,
    c.phone,
    COUNT(t.id) as total_tenders,
    COUNT(CASE WHEN t.status = 'OVERDUE' THEN 1 END) as overdue_tenders,
    COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_tenders,
    SUM(t.remaining_amount) as total_outstanding,
    AVG(CASE 
        WHEN t.status = 'OVERDUE' THEN DATEDIFF(CURDATE(), t.next_due_date)
        ELSE 0
    END) as avg_overdue_days,
    CASE 
        WHEN COUNT(CASE WHEN t.status = 'OVERDUE' THEN 1 END) = 0 THEN 'LOW'
        WHEN COUNT(CASE WHEN t.status = 'OVERDUE' THEN 1 END) / COUNT(t.id) < 0.3 THEN 'MEDIUM'
        ELSE 'HIGH'
    END as risk_level
FROM customers c
LEFT JOIN tenders t ON c.id = t.customer_id
WHERE c.status = 'ACTIVE'
GROUP BY c.id, c.name, c.phone;