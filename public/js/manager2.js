document.addEventListener('DOMContentLoaded', () => {
  console.log('Fetching data from /api/dashboardData...'); // Debugging

  fetch('/api/dashboardData')
    .then(res => res.json())
    .then(data => {
      console.log('Dashboard Data:', data); // Debugging

      if (!data) {
        console.error('No data received from the server.');
        return;
      }

      // Update Total Stock
      if (Array.isArray(data.totalStock) && data.totalStock.length > 0) {
        const stockList = data.totalStock
          .map(item => `<li>${item._id}: ${item.totalStock} kg</li>`)
          .join('');
        document.getElementById('total-stock').innerHTML = `<ul style="list-style-type: disc; text-align: left; padding-left: 20px;">${stockList}</ul>`;
      } else {
        console.warn('Total Stock data is missing or empty.');
        document.getElementById('total-stock').textContent = 'No data available';
      }

      // Update Total Sales
      if (data.totalRevenue) {
        document.getElementById('total-sales').textContent = `UGX ${data.totalRevenue.toLocaleString()}`;
      } else {
        document.getElementById('total-sales').textContent = 'UGX 0';
      }

      // Update Credit Balance
      if (data.totalCreditBalance) {
        document.getElementById('credit-sales').textContent = `UGX ${data.totalCreditBalance.toLocaleString()}`;
      } else {
        document.getElementById('credit-sales').textContent = 'UGX 0';
      }

      // Update Low Stock Items
      if (Array.isArray(data.lowStockItems) && data.lowStockItems.length > 0) {
        const lowStockList = data.lowStockItems
          .map(item => `<li>${item._id}: ${item.lowStock} kg</li>`)
          .join('');
        document.getElementById('low-stock-items').innerHTML = `<ul style="list-style-type: disc; text-align: left; padding-left: 20px;">${lowStockList}</ul>`;
      } else {
        console.warn('Low Stock Items data is missing or empty.');
        document.getElementById('low-stock-items').textContent = 'No data available';
      }

      // Draw Charts
      if (data.totalSales.length > 0) {
        drawSalesChart(data.totalSales);
      } else {
        console.warn('No sales data available for chart.');
      }

      if (data.dynamicStock.length > 0) {
        drawStockPie(data.dynamicStock);
      } else {
        console.warn('No stock data available for chart.');
      }
    })
    .catch(err => {
      console.error('Dashboard fetch error:', err);
    });
});

function drawSalesChart(salesData) {
  const labels = salesData.map(item => item._id);
  const values = salesData.map(item => item.totalSales);

  const ctx = document.getElementById('salesChart').getContext('2d');
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

function drawStockPie(stockData) {
  const labels = stockData.map(item => item.produceName);
  const values = stockData.map(item => item.remainingStock);

  const ctx = document.getElementById('stockPie').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: 'Stock Distribution (kg)',
        data: values,
        backgroundColor: ['#00bcd4', '#8bc34a', '#ff9800', '#e91e63', '#9c27b0', '#ffc107']
      }]
    },
    options: { responsive: true }
  });
}