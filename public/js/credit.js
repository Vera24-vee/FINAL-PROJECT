document.addEventListener('DOMContentLoaded', () => {
  const creditForm = document.getElementById('creditForm');

  const fields = {
    buyerName: document.getElementById('buyerName'),
    nin: document.getElementById('nin'),
    location: document.getElementById('location'),
    contact: document.getElementById('contact'),
    produceName: document.getElementById('produceName'),
    produceType: document.getElementById('produceType'),
    tonnage: document.getElementById('tonnage'),
    unitPrice: document.getElementById('unitPrice'),
    amountDue: document.getElementById('amountDue'),
    agentName: document.getElementById('agentName'),
    dueDate: document.getElementById('dueDate'),
    dispatchDate: document.getElementById('dispatchDate'),
    dispatchTime: document.getElementById('dispatchTime'),
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

  function isValidContact(contact) {
    return /^\d{9,}$/.test(contact);
  }

  function calculateAmountDue() {
    const tonnage = parseFloat(fields.tonnage.value) || 0;
    const unitPrice = parseFloat(fields.unitPrice.value) || 0;
    fields.amountDue.value = (tonnage * unitPrice).toFixed(2);
  }

  // Fetch unit price and max tonnage when produce is selected
  fields.produceName.addEventListener('change', async () => {
    const produceName = fields.produceName.value;
    if (produceName && produceName !== 'Select Produce') {
      try {
        const response = await fetch(`/getProduceInfo?produceName=${produceName}`);
        const data = await response.json();

        if (response.ok) {
          const { salePrice, tonnage } = data;
          fields.unitPrice.value = salePrice;
          fields.tonnage.max = tonnage;
          calculateAmountDue();
        } else {
          alert(data.error || "Failed to fetch produce info.");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        alert("Could not fetch produce data.");
      }
    }
  });

  fields.tonnage.addEventListener('input', calculateAmountDue);

  creditForm.addEventListener('submit', (e) => {
    let valid = true;
    Object.values(fields).forEach(clearError);

    if (!fields.buyerName.value.trim() || !isValidName(fields.buyerName.value)) {
      showError(fields.buyerName, "Enter a valid buyer's name.");
      valid = false;
    }

    if (!fields.nin.value.trim() || fields.nin.value.length < 13 || fields.nin.value.length > 15) {
      showError(fields.nin, "NIN must be between 13 and 15 characters.");
      valid = false;
    }

    if (!fields.location.value.trim()) {
      showError(fields.location, "Location is required.");
      valid = false;
    }

    if (!isValidContact(fields.contact.value)) {
      showError(fields.contact, "Contact must have at least 9 digits.");
      valid = false;
    }

    if (fields.produceName.value === 'Select Produce') {
      showError(fields.produceName, "Select a produce.");
      valid = false;
    }

    if (fields.produceType && fields.produceType.value === 'Select Type') {
      showError(fields.produceType, "Select a produce type.");
      valid = false;
    }

    const tonnage = parseFloat(fields.tonnage.value);
    if (isNaN(tonnage) || tonnage <= 0) {
      showError(fields.tonnage, "Tonnage must be greater than 0.");
      valid = false;
    }

    const unitPrice = parseFloat(fields.unitPrice.value);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      showError(fields.unitPrice, "Unit price is required.");
      valid = false;
    }

    const amountDue = parseFloat(fields.amountDue.value);
    if (isNaN(amountDue) || amountDue <= 0) {
      showError(fields.amountDue, "Amount due must be calculated.");
      valid = false;
    }

    if (!fields.agentName.value.trim() || !isValidName(fields.agentName.value)) {
      showError(fields.agentName, "Enter a valid agent name.");
      valid = false;
    }

    if (!fields.dueDate.value) {
      showError(fields.dueDate, "Due date is required.");
      valid = false;
    }

    if (!fields.dispatchDate.value) {
      showError(fields.dispatchDate, "Dispatch date is required.");
      valid = false;
    }

    if (!fields.dispatchTime.value) {
      showError(fields.dispatchTime, "Dispatch time is required.");
      valid = false;
    }

    if (!valid) {
      e.preventDefault();
    }
  });
});
