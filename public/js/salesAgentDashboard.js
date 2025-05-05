// Sales Overview Chart
const salesCtx = document.getElementById('salesChart').getContext('2d');
const salesChart = new Chart(salesCtx, {
  type: 'line',
  data: {
    labels: ['January', 'February', 'March', 'April', 'May'],
    datasets: [{
      label: 'Sales (UgX)',
      data: [1200000, 1500000, 1800000, 2000000, 2500000],
      borderColor: '#83c5be',
      backgroundColor: 'rgba(131, 197, 190, 0.5)',
      fill: true
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

// Credit Sales Pie Chart
const creditCtx = document.getElementById('creditPieChart').getContext('2d');
const creditPieChart = new Chart(creditCtx, {
  type: 'pie',
  data: {
    labels: ['Paid', 'Pending', 'Overdue'],
    datasets: [{
      data: [50, 30, 20],
      backgroundColor: ['#006d77', '#83c5be', '#edf6f9']
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
