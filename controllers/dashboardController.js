const Produce = require('../models/Produce');
const Sale = require('../models/Sale');
const CreditSale = require('../models/Credit');

const fetchAllData = async (branch = null) => {
  try {
    console.log('Fetching data from all collections...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const branchFilter = branch ? { branch } : {};

    // Step 1: Get added stock by produce
    const stockByProduce = await Produce.aggregate([
      { $match: branchFilter },
      {
        $group: {
          _id: "$produceName",
          totalAddedStock: { $sum: "$tonnage" },
          branch: { $first: "$branch" }
        }
      }
    ]);

    // Step 2: Get sold stock from Sale collection
    const cashSales = await Sale.aggregate([
      { $match: branchFilter },
      {
        $group: {
          _id: "$productName",
          totalSold: { $sum: "$tonnage" }
        }
      }
    ]);

    // Step 3: Get sold stock from Credit collection
    const creditSales = await CreditSale.aggregate([
      { $match: branchFilter },
      {
        $group: {
          _id: "$productName",
          totalSold: { $sum: "$tonnage" }
        }
      }
    ]);

    // Step 4: Combine sales tonnage into one map
    const totalSoldMap = {};
    for (const sale of [...cashSales, ...creditSales]) {
      const name = sale._id;
      totalSoldMap[name] = (totalSoldMap[name] || 0) + sale.totalSold;
    }

    // Step 5: Calculate dynamic stock
    const dynamicStock = stockByProduce.map(item => {
      const sold = totalSoldMap[item._id] || 0;
      return {
        produceName: item._id,
        remainingStock: Math.max(item.totalAddedStock - sold, 0),
        branch: item.branch
      };
    });

    // Perform remaining aggregations in parallel
    const [totalSales, totalCreditSales, totalCreditBalance, totalRevenue, lowStockItems] = await Promise.all([
      // Total sales by product (amount)
      Sale.aggregate([
        { $match: { ...branchFilter, saleDate: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: "$productName",
            totalSales: { $sum: "$total" },
            branch: { $first: "$branch" }
          }
        }
      ]),

      // Total credit sales
      CreditSale.aggregate([
        { $match: branchFilter },
        {
          $group: {
            _id: null,
            totalCreditSales: { $sum: "$amountDue" },
            branch: { $first: "$branch" }
          }
        }
      ]),

      // Total credit balance
      CreditSale.aggregate([
        { $match: branchFilter },
        {
          $group: {
            _id: null,
            totalBalance: { $sum: "$amountDue" }
          }
        }
      ]),

      // Total revenue from sales
      Sale.aggregate([
        { $match: { ...branchFilter, saleDate: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" }
          }
        }
      ]),

      // Low stock items (below 50kg in Produce collection only)
      Produce.aggregate([
        { $match: { ...branchFilter, tonnage: { $lt: 50 } } },
        {
          $group: {
            _id: "$produceName",
            lowStock: { $sum: "$tonnage" },
            branch: { $first: "$branch" }
          }
        }
      ])
    ]);

    // Return the aggregated data
    return {
      totalStock: stockByProduce,
      dynamicStock,
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
