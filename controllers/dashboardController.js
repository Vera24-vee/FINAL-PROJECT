const Produce = require('../models/Produce'); // Import the Produce model
const Sale = require('../models/Sale'); // Import the Sale model
const CreditSale = require('../models/Credit'); // Import the CreditSale model

const fetchAllData = async (branch = null) => {
  try {
    console.log('Fetching data from all collections...'); // Debugging

    // Define the date range for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Dynamic branch filter
    const branchFilter = branch ? { branch } : {};

    // Perform all aggregations in parallel
    const [totalStock, totalSales, totalCreditSales, totalCreditBalance, totalRevenue, lowStockItems] = await Promise.all([
      // Total stock by produce name (tonnage)
      Produce.aggregate([
        { $match: branchFilter },
        { $group: { _id: "$produceName", totalStock: { $sum: "$tonnage" }, branch: { $first: "$branch" } } }
      ]),

      // Total sales by produce name (amount)
      Sale.aggregate([
        { $match: { ...branchFilter, saleDate: { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$productName", totalSales: { $sum: "$total" }, branch: { $first: "$branch" } } }
      ]),

      // Total credit sales
      CreditSale.aggregate([
        { $match: branchFilter },
        { $group: { _id: null, totalCreditSales: { $sum: "$amountDue" }, branch: { $first: "$branch" } } }
      ]),

      // Total credit balance
      CreditSale.aggregate([
        { $match: branchFilter },
        { $group: { _id: null, totalBalance: { $sum: "$amountDue" } } }
      ]),

      // Total revenue
      Sale.aggregate([
        { $match: { ...branchFilter, saleDate: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
      ]),

      // Low stock items (below 50kg)
      Produce.aggregate([
        { $match: { ...branchFilter, tonnage: { $lt: 50 } } },
        { $group: { _id: "$produceName", lowStock: { $sum: "$tonnage" }, branch: { $first: "$branch" } } }
      ])
    ]);

    // Debugging logs for each aggregation
    console.log('Total Stock Aggregation:', JSON.stringify(totalStock, null, 2));
    console.log('Sales Aggregation:', JSON.stringify(totalSales, null, 2));
    console.log('Credit Sales Aggregation:', JSON.stringify(totalCreditSales, null, 2));
    console.log('Credit Balance Aggregation:', JSON.stringify(totalCreditBalance, null, 2));
    console.log('Revenue Aggregation:', JSON.stringify(totalRevenue, null, 2));
    console.log('Low Stock Items Aggregation:', JSON.stringify(lowStockItems, null, 2));

    // Return the aggregated data
    return {
      totalStock, // Include totalStock in the filtered data
      dynamicStock: totalStock.map(stockItem => ({
        produceName: stockItem._id,
        remainingStock: stockItem.totalStock
      })),
      totalSales,
      totalCreditSales,
      totalCreditBalance: totalCreditBalance[0]?.totalBalance || 0,
      totalRevenue: totalRevenue[0]?.totalRevenue || 0,
      lowStockItems
    };
  } catch (error) {
    console.error("Error during aggregation:", error);
    throw new Error('Failed to fetch data from the database.');
  }
};
module.exports = { fetchAllData };