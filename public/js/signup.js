
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');

  const fields = {
    fname: document.getElementById('fname'),
    lname: document.getElementById('lname'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    password: document.getElementById('password'),
    role: document.getElementById('role'),
    branch: document.getElementById('branch')
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

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  signupForm.addEventListener('submit', (e) => {
    let valid = true;
    Object.values(fields).forEach(clearError);

    if (!fields.fname.value.trim() || !isValidName(fields.fname.value)) {
      showError(fields.fname, 'Enter a valid first name (at least 2 letters).');
      valid = false;
    }

    if (!fields.lname.value.trim() || !isValidName(fields.lname.value)) {
      showError(fields.lname, 'Enter a valid last name (at least 2 letters).');
      valid = false;
    }

    if (!fields.email.value.trim() || !isValidEmail(fields.email.value)) {
      showError(fields.email, 'Enter a valid email address.');
      valid = false;
    }

    if (!isValidPhone(fields.phone.value)) {
      showError(fields.phone, 'Enter a valid phone number with at least 9 digits.');
      valid = false;
    }

    const isEditing = signupForm.action.includes('/editUser/');
    if (!fields.password.value.trim() && !isEditing) {
      showError(fields.password, 'Enter a password for the new user.');
      valid = false;
    }

    if (!fields.role.value || fields.role.value === 'Select Role') {
      showError(fields.role, 'Select a user role.');
      valid = false;
    }

    if (fields.role.value !== 'director' && (!fields.branch.value || fields.branch.value === 'Select Branch')) {
      showError(fields.branch, 'Select a branch for the user.');
      valid = false;
    }

    if (!valid) {
      e.preventDefault();
    }
  });
});

