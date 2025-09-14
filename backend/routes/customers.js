const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const [customers] = await db.execute(`
      SELECT c.*, 
             COUNT(t.id) as total_tenders,
             COALESCE(SUM(t.amount_given), 0) as total_amount_given,
             COALESCE(SUM(t.collected_amount), 0) as total_collected,
             COALESCE(SUM(t.remaining_amount), 0) as total_outstanding
      FROM customers c
      LEFT JOIN tenders t ON c.id = t.customer_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const [customers] = await db.execute(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id]
    );
    
    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Also get customer's tenders
    const [tenders] = await db.execute(
      'SELECT * FROM tenders WHERE customer_id = ?',
      [req.params.id]
    );
    
    res.json({ ...customers[0], tenders });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
      [name, phone, email || null, address || null]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Customer created successfully' 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Phone number already exists' });
    }
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    
    const [result] = await db.execute(
      'UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [name, phone, email || null, address || null, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Phone number already exists' });
    }
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    // Check if customer has tenders
    const [tenders] = await db.execute(
      'SELECT COUNT(*) as count FROM tenders WHERE customer_id = ?',
      [req.params.id]
    );
    
    if (tenders[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing tenders' 
      });
    }
    
    const [result] = await db.execute(
      'DELETE FROM customers WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;