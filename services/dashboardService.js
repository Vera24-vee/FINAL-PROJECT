const { Produces, Sales, Credits } = require("../models");

// Get Dashboard Data for a specific branch
async function getBranchDashboardData(branch) {
  // Total Tonnage for the branch
  const totalTonnageData = await Produces.aggregate([
    { $match: { branch } },
    { $group: { _id: null, totalTonnage: { $sum: "$tonnage" } } }
  ]);

  // Total Sales for the branch
  const totalSalesData = await Sales.aggregate([
    { $match: { branch } },
    { $group: { _id: null, totalSales: { $sum: "$total" } } }
  ]);

  // Total Credit for the branch
  const totalCreditData = await Credits.aggregate([
    { $match: { branch } },
    { $group: { _id: null, totalCredit: { $sum: "$amountDue" } } }
  ]);

  // Low Tonnage Items for the branch
  const lowTonnageItems = await Produces.find({
    branch,
    tonnage: { $lt: 50 }
  });

  // Produce Pie Chart Data (total tonnage per produce name)
  const producePieData = await Produces.aggregate([
    { $match: { branch } },
    { $group: { _id: "$produceName", totalTonnage: { $sum: "$tonnage" } } }
  ]);

  // Sales Data (by date for the branch)
  const salesData = await Sales.aggregate([
    { $match: { branch } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
        totalSales: { $sum: "$total" }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  return {
    totalTonnage: totalTonnageData[0]?.totalTonnage || 0,
    totalSales: totalSalesData[0]?.totalSales || 0,
    totalCredit: totalCreditData[0]?.totalCredit || 0,
    lowTonnageItems,
    producePieData,
    salesData
  };
}

// Get Aggregated Dashboard Data for Director (All Branches)
async function getDirectorDashboardData() {
  // Total Tonnage for all branches
  const totalTonnageData = await Produces.aggregate([
    { $group: { _id: null, totalTonnage: { $sum: "$tonnage" } } }
  ]);

  // Total Sales for all branches
  const totalSalesData = await Sales.aggregate([
    { $group: { _id: null, totalSales: { $sum: "$total" } } }
  ]);

  // Total Credit for all branches
  const totalCreditData = await Credits.aggregate([
    { $group: { _id: null, totalCredit: { $sum: "$amountDue" } } }
  ]);

  // Low Tonnage Items for all branches
  const lowTonnageItems = await Produces.find({ tonnage: { $lt: 50 } });

  // Produce Pie Chart Data (total tonnage per produce name) for all branches
  const producePieData = await Produces.aggregate([
    { $group: { _id: "$produceName", totalTonnage: { $sum: "$tonnage" } } }
  ]);

  // Sales Data (by date for all branches)
  const salesData = await Sales.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
        totalSales: { $sum: "$total" }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  return {
    totalTonnage: totalTonnageData[0]?.totalTonnage || 0,
    totalSales: totalSalesData[0]?.totalSales || 0,
    totalCredit: totalCreditData[0]?.totalCredit || 0,
    lowTonnageItems,
    producePieData,
    salesData
  };
}

module.exports = { getBranchDashboardData, getDirectorDashboardData };
