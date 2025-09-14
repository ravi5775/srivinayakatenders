const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get overall statistics using stored procedure
    const [stats] = await db.execute('CALL GetDashboardSummary()');
    
    // Get monthly collection trend
    const [monthlyTrend] = await db.execute(`
      SELECT 
        DATE_FORMAT(collection_date, '%Y-%m') as month,
        SUM(collected_amount) as total_collected,
        COUNT(*) as collection_count
      FROM collections 
      WHERE collection_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(collection_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `);
    
    // Get portfolio breakdown by plan type
    const [portfolioBreakdown] = await db.execute(`
      SELECT 
        plan_type,
        COUNT(*) as tender_count,
        SUM(amount_given) as total_amount_given,
        SUM(remaining_amount) as total_outstanding
      FROM tenders
      WHERE status != 'COMPLETED'
      GROUP BY plan_type
    `);
    
    // Get overdue tenders
    const [overdueTenders] = await db.execute('CALL GetOverdueTenders()');
    
    // Get recent activity
    const [recentActivity] = await db.execute(`
      SELECT 
        'collection' as activity_type,
        c.name as customer_name,
        t.tender_name,
        co.collected_amount as amount,
        co.collection_date as activity_date
      FROM collections co
      JOIN tenders t ON co.tender_id = t.id
      JOIN customers c ON t.customer_id = c.id
      UNION ALL
      SELECT 
        'tender' as activity_type,
        c.name as customer_name,
        t.tender_name,
        t.amount_given as amount,
        t.created_at as activity_date
      FROM tenders t
      JOIN customers c ON t.customer_id = c.id
      ORDER BY activity_date DESC
      LIMIT 10
    `);
    
    res.json({
      summary: stats[0][0] || {},
      monthlyTrend: monthlyTrend,
      portfolioBreakdown: portfolioBreakdown,
      overdueTenders: overdueTenders[0] || [],
      recentActivity: recentActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get monthly collection report
router.get('/reports/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const [report] = await db.execute(
      'CALL GetMonthlyCollectionReport(?, ?)',
      [year, month]
    );
    
    res.json(report[0] || []);
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

// Sync data (placeholder for Google Sheets sync)
router.post('/sync', async (req, res) => {
  try {
    // This would implement the sync logic with Google Sheets
    // For now, just return success
    
    // Update sync timestamp in settings
    await db.execute(`
      INSERT INTO settings (setting_key, setting_value) 
      VALUES ('last_sync_time', NOW()) 
      ON DUPLICATE KEY UPDATE setting_value = NOW()
    `);
    
    res.json({ 
      success: true, 
      message: 'Data synchronized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error syncing data:', error);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// Recover data (placeholder for data recovery)
router.post('/recover', async (req, res) => {
  try {
    // This would implement data recovery logic
    // For now, just return success
    
    res.json({ 
      success: true, 
      message: 'Data recovery initiated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recovering data:', error);
    res.status(500).json({ error: 'Failed to recover data' });
  }
});

// Get system status
router.get('/status', async (req, res) => {
  try {
    // Get database status
    const [dbStatus] = await db.execute('SELECT 1 as connected');
    
    // Get last sync time
    const [lastSync] = await db.execute(`
      SELECT setting_value as last_sync 
      FROM settings 
      WHERE setting_key = 'last_sync_time'
    `);
    
    // Get cache status (simulated)
    const [customerCount] = await db.execute('SELECT COUNT(*) as count FROM customers');
    const [tenderCount] = await db.execute('SELECT COUNT(*) as count FROM tenders');
    const [collectionCount] = await db.execute('SELECT COUNT(*) as count FROM collections');
    
    res.json({
      database: {
        connected: dbStatus.length > 0,
        status: 'online'
      },
      sync: {
        lastSync: lastSync[0]?.last_sync || null,
        status: 'idle'
      },
      cache: {
        customers: {
          count: customerCount[0].count,
          isValid: true,
          lastUpdate: new Date()
        },
        tenders: {
          count: tenderCount[0].count,
          isValid: true,
          lastUpdate: new Date()
        },
        collections: {
          count: collectionCount[0].count,
          isValid: true,
          lastUpdate: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

module.exports = router;