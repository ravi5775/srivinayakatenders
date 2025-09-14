const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all collections
router.get('/', async (req, res) => {
  try {
    const [collections] = await db.execute(`
      SELECT co.*, t.tender_name, c.name as customer_name, c.phone as customer_phone
      FROM collections co
      JOIN tenders t ON co.tender_id = t.id
      JOIN customers c ON t.customer_id = c.id
      ORDER BY co.collection_date DESC
    `);
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Record new collection
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      tender_id,
      collected_amount,
      collection_date = new Date(),
      payment_method = 'Cash',
      receipt_number,
      collected_by,
      notes
    } = req.body;
    
    if (!tender_id || !collected_amount) {
      return res.status(400).json({ 
        error: 'Tender ID and collection amount are required' 
      });
    }
    
    // Get tender details
    const [tenders] = await connection.execute(
      'SELECT * FROM tenders WHERE id = ?',
      [tender_id]
    );
    
    if (tenders.length === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    
    const tender = tenders[0];
    
    // Insert collection record
    const [collectionResult] = await connection.execute(`
      INSERT INTO collections (
        tender_id, collected_amount, collection_date, payment_method,
        receipt_number, collected_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      tender_id, collected_amount, collection_date, payment_method,
      receipt_number, collected_by, notes
    ]);
    
    // Update tender amounts
    const newCollectedAmount = tender.collected_amount + parseFloat(collected_amount);
    const newRemainingAmount = tender.total_amount - newCollectedAmount;
    
    // Calculate installments paid (assuming equal installments)
    const installmentsPaid = Math.floor(newCollectedAmount / tender.installment_amount);
    const remainingInstallments = tender.total_installments - installmentsPaid;
    
    // Calculate next due date
    let nextDueDate = new Date(tender.next_due_date);
    if (tender.installment_type === 'Daily') {
      nextDueDate.setDate(nextDueDate.getDate() + 1);
    } else {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }
    
    // Determine status
    let status = 'ACTIVE';
    if (newRemainingAmount <= 0 || remainingInstallments <= 0) {
      status = 'COMPLETED';
    } else if (nextDueDate < new Date()) {
      status = 'OVERDUE';
    }
    
    // Update tender
    await connection.execute(`
      UPDATE tenders SET
        collected_amount = ?,
        remaining_amount = ?,
        paid_installments = ?,
        remaining_installments = ?,
        next_due_date = ?,
        status = ?
      WHERE id = ?
    `, [
      newCollectedAmount,
      Math.max(0, newRemainingAmount),
      installmentsPaid,
      Math.max(0, remainingInstallments),
      nextDueDate,
      status,
      tender_id
    ]);
    
    await connection.commit();
    
    res.status(201).json({ 
      id: collectionResult.insertId, 
      message: 'Collection recorded successfully' 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error recording collection:', error);
    res.status(500).json({ error: 'Failed to record collection' });
  } finally {
    connection.release();
  }
});

// Update collection
router.put('/:id', async (req, res) => {
  try {
    const { notes, payment_method, receipt_number } = req.body;
    
    const [result] = await db.execute(
      'UPDATE collections SET notes = ?, payment_method = ?, receipt_number = ? WHERE id = ?',
      [notes, payment_method, receipt_number, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    res.json({ message: 'Collection updated successfully' });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Delete collection
router.delete('/:id', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get collection details first
    const [collections] = await connection.execute(
      'SELECT * FROM collections WHERE id = ?',
      [req.params.id]
    );
    
    if (collections.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    const collection = collections[0];
    
    // Delete collection
    await connection.execute(
      'DELETE FROM collections WHERE id = ?',
      [req.params.id]
    );
    
    // Recalculate tender amounts (you may want to implement this)
    // For now, just delete the collection
    
    await connection.commit();
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  } finally {
    connection.release();
  }
});

module.exports = router;