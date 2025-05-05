document.addEventListener('DOMContentLoaded', function() {
    const procurementForm = document.getElementById('procurementForm');
    const produceNameInput = document.getElementById('produceName');
    const produceTypeInput = document.getElementById('produceType');
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const tonnageInput = document.getElementById('tonnage');
    const costInput = document.getElementById('cost');
    const dealerNameInput = document.getElementById('dealerName');
    const contactInput = document.getElementById('contact');
    const salePriceInput = document.getElementById('salePrice');
  
    function showError(inputElement, errorMessage) {
      const errorElement = document.getElementById(inputElement.id + 'Error');
      errorElement.textContent = errorMessage;
      errorElement.style.display = 'block';
    }
  
    function clearError(inputElement) {
      const errorElement = document.getElementById(inputElement.id + 'Error');
      errorElement.style.display = 'none';
    }
  
    procurementForm.addEventListener('submit', function(event) {
      let valid = true;
  
      // Clear all previous errors
      [produceNameInput, produceTypeInput, dateInput, timeInput, tonnageInput,
       costInput, dealerNameInput, contactInput, salePriceInput]
       .forEach(clearError);
  
      // Perform validation
      if (produceNameInput.value === "" || produceNameInput.value === "Select Produce") {
        showError(produceNameInput, "Please select a produce name.");
        valid = false;
      }
  
      if (produceTypeInput.value === "" || produceTypeInput.value === "Select Type") {
        showError(produceTypeInput, "Please select a produce type.");
        valid = false;
      }
  
      if (dateInput.value === "") {
        showError(dateInput, "Please select a date.");
        valid = false;
      }
  
      if (timeInput.value === "") {
        showError(timeInput, "Please select a time.");
        valid = false;
      }
  
      const tonnage = parseFloat(tonnageInput.value);
      if (isNaN(tonnage) || tonnage <= 0) {
        showError(tonnageInput, "Please enter a valid tonnage.");
        valid = false;
      }
  
      const cost = parseFloat(costInput.value);
      if (isNaN(cost) || cost <= 0) {
        showError(costInput, "Please enter a valid unit price.");
        valid = false;
      }
  
      if (dealerNameInput.value === "" || dealerNameInput.value === "Select Dealer") {
        showError(dealerNameInput, "Please select a dealer.");
        valid = false;
      }
  
      const contact = contactInput.value.trim();
      const phonePattern = /^[0-9]{10}$/;
      if (contact && !phonePattern.test(contact)) {
        showError(contactInput, "Please enter a valid 10-digit contact number.");
        valid = false;
      }
  
      const salePrice = parseFloat(salePriceInput.value);
      if (salePrice && (isNaN(salePrice) || salePrice <= 0)) {
        showError(salePriceInput, "Please enter a valid selling price.");
        valid = false;
      }
  
      if (!valid) {
        event.preventDefault();
      }
    });
});
