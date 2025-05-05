const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Produce = require('../models/Produce');
const Sale = require('../models/Sale');
const Credit = require('../models/Credit');

// Example route: /api/dashboard?branch=Maganjo
router.get('/api/dashboardData', async (req, res) => {
    const branch = (req.query.branch || 'maganjo').toLowerCase();

  try {
    // Total Stock per Produce
    const totalStock = await Produce.aggregate([
      { $match: { branch } },
      {
        $group: {
          _id: '$produceName',
          totalKg: { $sum: '$tonnage' }
        }
      }
    ]);

    // Total Sales Revenue per Produce
    const salesData = await Sale.aggregate([
      { $match: { branch } },
      {
        $group: {
          _id: '$produceName',
          totalRevenue: { $sum: '$amountDue' }
        }
      }
    ]);

    // Credit Sales per Produce
    const creditData = await Credit.aggregate([
      { $match: { branch } },
      {
        $group: {
          _id: '$produceName',
          totalCredit: { $sum: '$amountDue' }
        }
      }
    ]);

    // Total Credit Balance
    const creditBalance = await Credit.aggregate([
      { $match: { branch } },
      {
        $group: {
          _id: null,
          balance: { $sum: '$amountDue' }
        }
      }
    ]);

    // Total Sales Revenue
    const totalSalesRevenue = await Sale.aggregate([
      { $match: { branch } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountDue' }
        }
      }
    ]);

    // Low Stock (< 50kg)
    const lowStockItems = await Produce.aggregate([
      { $match: { branch } },
      {
        $group: {
          _id: '$produceName',
          totalKg: { $sum: '$tonnage' }
        }
      },
      { $match: { totalKg: { $lt: 50 } } }
    ]);

    res.json({
      totalStock,
      salesData,
      creditData,
      creditBalance: creditBalance[0]?.balance || 0,
      totalSalesRevenue: totalSalesRevenue[0]?.total || 0,
      lowStockItems
    });

  } catch (err) {
    console.error('Dashboard aggregation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
