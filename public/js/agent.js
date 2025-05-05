document.addEventListener('DOMContentLoaded', () => {
    console.log('Fetching dashboard data...');
  
    // Fetch dashboard data dynamically
    fetch('/api/dashboardData')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Dashboard Data:', data);
  
        if (!data) {
          console.error('No data received from the server.');
          return;
        }
  
        // Update Total Sales Today
        console.log('Total Revenue:', data.totalRevenue); // Debugging
        updateElement('total-sales', data.totalRevenue, 'UGX', '0');
  
        // Update Credit Balance
        console.log('Credit Balance:', data.creditBalance); // Debugging
        updateElement('credit-balance', data.creditBalance, 'UGX', '0');  
        // Update Pending Orders (fallback to 0 if not provided)
        console.log('Pending Orders:', data.pendingOrders); // Debugging
        updateElement('pending-orders', data.pendingOrders || 0, '', '0');
  
        // Draw Sales Trend Chart
        if (Array.isArray(data.totalSales) && data.totalSales.length > 0) {
          drawSalesTrendChart(data.totalSales);
        } else {
          console.warn('No sales trend data available.');
          document.getElementById('salesTrendChart').textContent = 'No sales trend data available';
        }
  
        // Draw Stock Overview Chart
        if (Array.isArray(data.totalStock) && data.totalStock.length > 0) {
          drawStockOverviewChart(data.totalStock);
        } else {
          console.warn('No stock overview data available.');
          document.getElementById('stockPie').textContent = 'No stock overview data available';
        }
      })
      .catch(err => {
        console.error('Error fetching dashboard data:', err);
      });
  });
  
  // Helper function to update DOM elements
  function updateElement(elementId, value, prefix = '', fallback = '0') {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with ID "${elementId}" not found.`);
      return;
    }
    if (value !== undefined && value !== null) {
      console.log(`Updating ${elementId} with value: ${value}`); // Debugging
      element.textContent = `${prefix} ${value.toLocaleString()}`;
    } else {
      console.warn(`Value for ${elementId} is undefined or null. Using fallback: ${fallback}`);
      element.textContent = `${prefix} ${fallback}`;
    }
  }
  
  // Function to draw the Sales Trend Chart
  function drawSalesTrendChart(salesData) {
    const labels = salesData.map(item => item._id); // Product names
    const values = salesData.map(item => item.totalSales); // Sales amounts
  
    const ctx = document.getElementById('salesTrendChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Sales Revenue (UGX)',
          data: values,
          backgroundColor: 'rgba(0, 204, 255, 0.6)',
          borderColor: 'rgba(0, 204, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
  
  // Function to draw the Stock Overview Chart
  function drawStockOverviewChart(stockData) {
    const labels = stockData.map(item => item._id); // Product names
    const values = stockData.map(item => item.totalStock); // Stock quantities
  
    const ctx = document.getElementById('stockPie').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          label: 'Stock Overview (kg)',
          data: values,
          backgroundColor: ['#00bcd4', '#8bc34a', '#ff9800', '#e91e63', '#9c27b0', '#ffc107']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    });
  }