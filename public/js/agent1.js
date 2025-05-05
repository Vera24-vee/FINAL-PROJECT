document.addEventListener('DOMContentLoaded', () => {
    console.log('Fetching dashboard data...');
  
    // Fetch dashboard data dynamically
    fetch('/api/dashboardData')
      .then(res => res.json())
      .then(data => {
        console.log('Dashboard Data:', data);
  
        if (!data) {
          console.error('No data received from the server.');
          return;
        }
  
        // Update Total Sales Today
        updateElement('total-sales', data.totalSalesToday, 'UGX', '0');
  
        // Update Credit Balance
        updateElement('credit-balance', data.creditBalance, 'UGX', '0');
  
        // Update Pending Orders
        updateElement('pending-orders', data.pendingOrders, '', '0');
  
        // Draw Sales Trend Chart
        if (Array.isArray(data.salesTrend) && data.salesTrend.length > 0) {
          drawSalesTrendChart(data.salesTrend);
        } else {
          console.warn('No sales trend data available.');
          document.getElementById('salesTrendChart').textContent = 'No sales trend data available';
        }
  
        // Draw Stock Overview Chart
        if (Array.isArray(data.stockOverview) && data.stockOverview.length > 0) {
          drawStockOverviewChart(data.stockOverview);
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
  function updateElement(elementId, value, prefix = '', fallback = '') {
    const element = document.getElementById(elementId);
    if (value !== undefined && value !== null) {
      element.textContent = `${prefix} ${value.toLocaleString()}`;
    } else {
      element.textContent = `${prefix} ${fallback}`;
    }
  }
  
  // Function to draw the Sales Trend Chart
  function drawSalesTrendChart(salesTrend) {
    const labels = salesTrend.map(item => item._id);
    const values = salesTrend.map(item => item.totalSales);
  
    const ctx = document.getElementById('salesTrendChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Sales Trend (UGX)',
          data: values,
          borderColor: 'rgba(0, 204, 255, 1)',
          backgroundColor: 'rgba(0, 204, 255, 0.2)',
          borderWidth: 2
        }]
      },
      options: { responsive: true }
    });
  }
  
  // Function to draw the Stock Overview Chart
  function drawStockOverviewChart(stockOverview) {
    const labels = stockOverview.map(item => item._id);
    const values = stockOverview.map(item => item.remainingStock);
  
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
      options: { responsive: true }
    });
  }