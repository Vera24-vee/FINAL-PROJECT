document.addEventListener('DOMContentLoaded', () => {
  const saleForm = document.getElementById('saleForm');

  const fields = {
    productName: document.getElementById('productName'),
    category: document.getElementById('category'),
    unitPrice: document.getElementById('unitPrice'),
    tonnage: document.getElementById('tonnage'),
    total: document.getElementById('total'),
    buyerName: document.getElementById('buyerName'),
    phone: document.getElementById('phone'),
    saleDate: document.getElementById('saleDate'),
    saleTime: document.getElementById('saleTime'),
    paymentMode: document.getElementById('paymentMode'),
    branch: document.getElementById('branch'),
    agentName: document.getElementById('agentName')
  };

  function showError(input, message) {
    const error = document.getElementById(`${input.id}Error`);
    if (error) {
      error.textContent = message;
      error.classList.remove('hidden');
    }
  }

  function clearError(input) {
    const error = document.getElementById(`${input.id}Error`);
    if (error) {
      error.textContent = '';
      error.classList.add('hidden');
    }
  }

  function isValidName(name) {
    return /^[A-Za-z\s.'-]{2,}$/.test(name);
  }

  function isValidPhone(phone) {
    return /^\d{9,}$/.test(phone);
  }

  function calculateTotal() {
    const tonnage = parseFloat(fields.tonnage.value) || 0;
    const unitPrice = parseFloat(fields.unitPrice.value) || 0;
    fields.total.value = (tonnage * unitPrice).toFixed(2);
  }

  // Fetch unit price and available tonnage from backend when a product is selected
  fields.productName.addEventListener('change', async () => {
    const productName = fields.productName.value;
    if (productName && productName !== 'Select Produce') {
      try {
        const response = await fetch(`/getProduceInfo?produceName=${productName}`);
        const data = await response.json();

        if (response.ok) {
          const { salePrice, tonnage } = data;
          fields.unitPrice.value = salePrice;
          fields.tonnage.max = tonnage;
          calculateTotal();
        } else {
          alert(data.error || 'Failed to fetch produce info.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        alert('Could not fetch produce data.');
      }
    }
  });

  // Recalculate total on input
  fields.tonnage.addEventListener('input', calculateTotal);
  fields.unitPrice.addEventListener('input', calculateTotal);

  saleForm.addEventListener('submit', (e) => {
    let valid = true;
    Object.values(fields).forEach(clearError);

    if (fields.productName.value === 'Select Produce') {
      showError(fields.productName, 'Please choose a produce from the list.');
      valid = false;
    }

    if (fields.category.value === 'Select Category') {
      showError(fields.category, 'Please choose a category (e.g., Grain, Legume).');
      valid = false;
    }

    const unitPrice = parseFloat(fields.unitPrice.value);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      showError(fields.unitPrice, 'Enter the unit price (must be a positive number).');
      valid = false;
    }

    const tonnage = parseFloat(fields.tonnage.value);
    if (isNaN(tonnage) || tonnage <= 0) {
      showError(fields.tonnage, 'Enter the amount sold in kg (must be greater than 0).');
      valid = false;
    } else if (fields.tonnage.max && tonnage > parseFloat(fields.tonnage.max)) {
      showError(fields.tonnage, `You only have ${fields.tonnage.max} kg in stock.`);
      valid = false;
    }

    const total = parseFloat(fields.total.value);
    if (isNaN(total) || total <= 0) {
      showError(fields.total, 'Total will be calculated automatically — ensure fields are filled correctly.');
      valid = false;
    }

    if (!fields.buyerName.value.trim() || !isValidName(fields.buyerName.value)) {
      showError(fields.buyerName, "Enter the buyer's full name (at least 2 letters).");
      valid = false;
    }

    if (!isValidPhone(fields.phone.value)) {
      showError(fields.phone, 'Enter a valid phone number with at least 9 digits.');
      valid = false;
    }

    if (!fields.saleDate.value) {
      showError(fields.saleDate, 'Please select the date of sale.');
      valid = false;
    }

    if (!fields.saleTime.value) {
      showError(fields.saleTime, 'Please select the time of sale.');
      valid = false;
    }

    if (fields.paymentMode.value === 'Select Payment Mode') {
      showError(fields.paymentMode, 'Please choose how the payment was made (e.g., Cash, Mobile).');
      valid = false;
    }

    if (!fields.agentName.value.trim() || !isValidName(fields.agentName.value)) {
      showError(fields.agentName, 'Enter your name (agent) to record who made the sale.');
      valid = false;
    }

    if (!valid) {
      e.preventDefault();
    }
  });
});
