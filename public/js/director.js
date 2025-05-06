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

      // Update Total Revenue
      console.log('Total Revenue:', data.totalRevenue); // Debugging
      updateElement('total-revenue', data.totalRevenue, 'UGX', '0');

      // Update Credit Balance by Branch
      if (Array.isArray(data.totalCreditSales) && data.totalCreditSales.length > 0) {
        const creditBalanceByBranch = data.totalCreditSales.reduce((acc, item) => {
          if (item.branch) {
            acc[item.branch] = acc[item.branch] || 0;
            acc[item.branch] += item.totalCreditSales;
          }
          return acc;
        }, {});
        updateList('credit-balance-by-branch', creditBalanceByBranch, 'UGX');
      } else {
        console.warn('No credit balance data available.');
        document.getElementById('credit-balance-by-branch').textContent = 'No data available';
      }

      // Update Sales by Branch
      if (Array.isArray(data.totalSales) && data.totalSales.length > 0) {
        const salesByBranch = data.totalSales.reduce((acc, item) => {
          acc[item.branch] = acc[item.branch] || [];
          acc[item.branch].push(`${item._id}: UGX ${item.totalSales.toLocaleString()}`);
          return acc;
        }, {});
        updateList('sales-by-branch', salesByBranch);
      } else {
        console.warn('No sales data available.');
        document.getElementById('sales-by-branch').textContent = 'No data available';
      }

      // Update Stock by Branch (corrected to use totalAddedStock)
      if (Array.isArray(data.totalStock) && data.totalStock.length > 0) {
        const stockByBranch = data.totalStock.reduce((acc, item) => {
          acc[item.branch] = acc[item.branch] || [];
          acc[item.branch].push(`${item._id}: ${item.totalAddedStock} kg`);
          return acc;
        }, {});
        updateList('stock-by-branch', stockByBranch);
      } else {
        console.warn('No stock data available.');
        document.getElementById('stock-by-branch').textContent = 'No data available';
      }

      // Draw Branch Sales Chart
      if (Array.isArray(data.totalSales) && data.totalSales.length > 0) {
        drawSalesTrendChart(data.totalSales);
      } else {
        console.warn('No sales trend data available.');
        document.getElementById('branchSalesChart').textContent = 'No sales trend data available';
      }

      // Draw Stock Distribution Chart (corrected to use totalAddedStock)
      if (Array.isArray(data.totalStock) && data.totalStock.length > 0) {
        drawStockOverviewChart(data.totalStock);
      } else {
        console.warn('No stock overview data available.');
        document.getElementById('overallStockChart').textContent = 'No stock overview data available';
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

// Helper function to update lists
function updateList(elementId, data, prefix = '') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID "${elementId}" not found.`);
    return;
  }
  element.innerHTML = Object.entries(data)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `<li><strong>${key}:</strong> ${value.join(', ')}</li>`;
      }
      return `<li><strong>${key}:</strong> ${prefix} ${value.toLocaleString()}</li>`;
    })
    .join('');
}

// Function to draw the Sales Trend Chart
function drawSalesTrendChart(salesData) {
  const labels = salesData.map(item => `${item._id} (${item.branch})`);
  const values = salesData.map(item => item.totalSales);

  const ctx = document.getElementById('branchSalesChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Branch Sales (UGX)',
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

// Function to draw the Stock Overview Chart (corrected to use totalAddedStock)
function drawStockOverviewChart(stockData) {
  const labels = stockData.map(item => `${item._id} (${item.branch})`);
  const values = stockData.map(item => item.totalAddedStock);

  const ctx = document.getElementById('overallStockChart').getContext('2d');
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
