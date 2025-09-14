const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all tenders
router.get('/', async (req, res) => {
  try {
    const [tenders] = await db.execute(`
      SELECT t.*, c.name as customer_name, c.phone as customer_phone
      FROM tenders t
      JOIN customers c ON t.customer_id = c.id
      ORDER BY t.created_at DESC
    `);
    res.json(tenders);
  } catch (error) {
    console.error('Error fetching tenders:', error);
    res.status(500).json({ error: 'Failed to fetch tenders' });
  }
});

// Get single tender
router.get('/:id', async (req, res) => {
  try {
    const [tenders] = await db.execute(`
      SELECT t.*, c.name as customer_name, c.phone as customer_phone
      FROM tenders t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.id = ?
    `, [req.params.id]);
    
    if (tenders.length === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    
    // Get collections for this tender
    const [collections] = await db.execute(
      'SELECT * FROM collections WHERE tender_id = ? ORDER BY collection_date DESC',
      [req.params.id]
    );
    
    res.json({ ...tenders[0], collections });
  } catch (error) {
    console.error('Error fetching tender:', error);
    res.status(500).json({ error: 'Failed to fetch tender' });
  }
});

// Create new tender
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      customer_id,
      tender_name,
      plan_type,
      installment_type,
      amount_given,
      interest_amount = 0,
      start_date,
      duration_months,
      notes
    } = req.body;
    
    if (!customer_id || !plan_type || !installment_type || !amount_given) {
      return res.status(400).json({ 
        error: 'Customer ID, plan type, installment type, and amount are required' 
      });
    }
    
    // Calculate installment details based on plan type
    let installment_amount, total_installments, total_amount;
    
    if (installment_type === 'Daily') {
      // For daily: 100 per day, no interest
      installment_amount = 100;
      total_installments = Math.ceil(amount_given / 100);
      total_amount = amount_given; // No interest for daily
    } else if (installment_type === 'Monthly') {
      // For monthly: include interest
      total_amount = amount_given + (interest_amount || 0);
      total_installments = duration_months || 12;
      installment_amount = total_amount / total_installments;
    }
    
    // Calculate next due date
    const nextDueDate = new Date(start_date);
    if (installment_type === 'Daily') {
      nextDueDate.setDate(nextDueDate.getDate() + 1);
    } else {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }
    
    const [result] = await connection.execute(`
      INSERT INTO tenders (
        customer_id, tender_name, plan_type, installment_type,
        amount_given, interest_amount, total_amount, installment_amount,
        total_installments, remaining_installments, remaining_amount,
        start_date, next_due_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer_id, tender_name, plan_type, installment_type,
      amount_given, interest_amount, total_amount, installment_amount,
      total_installments, total_installments, total_amount,
      start_date, nextDueDate, notes || null
    ]);
    
    await connection.commit();
    
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Tender created successfully' 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating tender:', error);
    res.status(500).json({ error: 'Failed to create tender' });
  } finally {
    connection.release();
  }
});

// Update tender
router.put('/:id', async (req, res) => {
  try {
    const { tender_name, notes, status } = req.body;
    
    const [result] = await db.execute(
      'UPDATE tenders SET tender_name = ?, notes = ?, status = ? WHERE id = ?',
      [tender_name, notes, status, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    
    res.json({ message: 'Tender updated successfully' });
  } catch (error) {
    console.error('Error updating tender:', error);
    res.status(500).json({ error: 'Failed to update tender' });
  }
});

// Delete tender
router.delete('/:id', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Delete related collections first
    await connection.execute(
      'DELETE FROM collections WHERE tender_id = ?',
      [req.params.id]
    );
    
    // Delete tender
    const [result] = await connection.execute(
      'DELETE FROM tenders WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    
    await connection.commit();
    res.json({ message: 'Tender deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting tender:', error);
    res.status(500).json({ error: 'Failed to delete tender' });
  } finally {
    connection.release();
  }
});

module.exports = router;