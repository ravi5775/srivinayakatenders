-- ===========================================
-- Sri Vinaya Tender - Stored Procedures
-- ===========================================

USE sri_vinaya_tender;

DELIMITER //

-- ===========================================
-- 1. Add New Collection and Update Tender
-- ===========================================
CREATE PROCEDURE AddCollection(
    IN p_tender_id INT,
    IN p_collected_amount DECIMAL(10,2),
    IN p_installments_covered INT,
    IN p_collection_date DATE,
    IN p_payment_method VARCHAR(20),
    IN p_notes TEXT,
    IN p_collected_by VARCHAR(255)
)
BEGIN
    DECLARE v_customer_id INT;
    DECLARE v_remaining_amount DECIMAL(10,2);
    DECLARE v_remaining_installments INT;
    DECLARE v_next_due_date DATE;
    DECLARE v_installment_type VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Get tender details
    SELECT customer_id, remaining_amount, remaining_installments, 
           next_due_date, installment_type
    INTO v_customer_id, v_remaining_amount, v_remaining_installments,
         v_next_due_date, v_installment_type
    FROM tenders 
    WHERE id = p_tender_id;
    
    -- Insert collection record
    INSERT INTO collections (
        tender_id, customer_id, collected_amount, installments_covered,
        collection_date, payment_method, notes, collected_by
    ) VALUES (
        p_tender_id, v_customer_id, p_collected_amount, p_installments_covered,
        p_collection_date, p_payment_method, p_notes, p_collected_by
    );
    
    -- Calculate next due date based on installment type
    CASE v_installment_type
        WHEN 'Daily' THEN 
            SET v_next_due_date = DATE_ADD(v_next_due_date, INTERVAL p_installments_covered DAY);
        WHEN 'Weekly' THEN 
            SET v_next_due_date = DATE_ADD(v_next_due_date, INTERVAL p_installments_covered WEEK);
        WHEN 'Monthly' THEN 
            SET v_next_due_date = DATE_ADD(v_next_due_date, INTERVAL p_installments_covered MONTH);
    END CASE;
    
    -- Update tender with new calculations
    UPDATE tenders SET
        collected_amount = collected_amount + p_collected_amount,
        paid_installments = paid_installments + p_installments_covered,
        remaining_amount = remaining_amount - p_collected_amount,
        remaining_installments = remaining_installments - p_installments_covered,
        next_due_date = v_next_due_date,
        status = CASE 
            WHEN (remaining_installments - p_installments_covered) <= 0 THEN 'COMPLETED'
            WHEN CURDATE() > v_next_due_date THEN 'OVERDUE'
            ELSE 'ACTIVE'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_tender_id;
    
    COMMIT;
    
    SELECT 'Collection added successfully' as message;
    
END //

-- ===========================================
-- 2. Get Dashboard Summary
-- ===========================================
CREATE PROCEDURE GetDashboardSummary()
BEGIN
    SELECT 
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(t.id) as total_tenders,
        COUNT(CASE WHEN t.status = 'ACTIVE' THEN 1 END) as active_tenders,
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_tenders,
        COUNT(CASE WHEN t.status = 'OVERDUE' THEN 1 END) as overdue_tenders,
        COALESCE(SUM(t.total_amount), 0) as total_given,
        COALESCE(SUM(t.collected_amount), 0) as total_collected,
        COALESCE(SUM(t.remaining_amount), 0) as total_outstanding,
        COALESCE(AVG(t.installment_amount), 0) as avg_installment
    FROM customers c
    LEFT JOIN tenders t ON c.id = t.customer_id;
END //

-- ===========================================
-- 3. Get Monthly Collection Report
-- ===========================================
CREATE PROCEDURE GetMonthlyCollectionReport(
    IN p_year INT,
    IN p_month INT
)
BEGIN
    SELECT 
        c.collection_date,
        cu.name as customer_name,
        t.tender_name,
        c.collected_amount,
        c.installments_covered,
        c.payment_method,
        c.notes
    FROM collections c
    JOIN tenders t ON c.tender_id = t.id
    JOIN customers cu ON c.customer_id = cu.id
    WHERE YEAR(c.collection_date) = p_year
    AND MONTH(c.collection_date) = p_month
    ORDER BY c.collection_date DESC, cu.name;
END //

-- ===========================================
-- 4. Get Overdue Tenders
-- ===========================================
CREATE PROCEDURE GetOverdueTenders()
BEGIN
    SELECT 
        t.id,
        t.tender_name,
        c.name as customer_name,
        c.phone,
        t.installment_amount,
        t.remaining_amount,
        t.remaining_installments,
        t.next_due_date,
        DATEDIFF(CURDATE(), t.next_due_date) as days_overdue
    FROM tenders t
    JOIN customers c ON t.customer_id = c.id
    WHERE t.status = 'OVERDUE' 
    OR (t.status = 'ACTIVE' AND t.next_due_date < CURDATE())
    ORDER BY days_overdue DESC;
END //

-- ===========================================
-- 5. Update Tender Status (Daily Maintenance)
-- ===========================================
CREATE PROCEDURE UpdateTenderStatus()
BEGIN
    UPDATE tenders 
    SET status = 'OVERDUE'
    WHERE status = 'ACTIVE' 
    AND next_due_date < CURDATE();
    
    UPDATE tenders 
    SET status = 'COMPLETED'
    WHERE remaining_installments <= 0 
    OR remaining_amount <= 0;
    
    SELECT ROW_COUNT() as updated_records;
END //

DELIMITER ;

-- ===========================================
-- Create Events for Automatic Status Updates
-- ===========================================
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS daily_status_update
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 6 HOUR
DO
    CALL UpdateTenderStatus();