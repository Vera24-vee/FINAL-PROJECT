const express = require('express');
const router = express.Router();
const { fetchAllData } = require('../controllers/dashboardController');

// Route to fetch dashboard data
router.get('/dashboardData', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

    const { role, branch } = req.user; // Extract role and branch from authenticated user
    const branchFilter = role === 'director' ? null : branch; // Directors see all branches

    console.log(`User Role: ${role}, Branch: ${branchFilter}`); // Debugging

    const filteredData = await fetchAllData(branchFilter);

    if (!filteredData || Object.keys(filteredData).length === 0) {
      return res.status(404).json({ message: 'No data available for the specified branch.' });
    }

    res.status(200).json(filteredData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data.', error: error.message });
  }
});

module.exports = router;