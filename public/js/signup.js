document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');

  const fields = {
    fname: document.getElementById('fname'),
    lname: document.getElementById('lname'),
    email: document.getElementById('email'),
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

    // Validate first name
    if (!fields.fname.value.trim() || !isValidName(fields.fname.value)) {
      showError(fields.fname, 'Enter a valid first name (at least 2 letters).');
      valid = false;
    }

    // Validate last name
    if (!fields.lname.value.trim() || !isValidName(fields.lname.value)) {
      showError(fields.lname, 'Enter a valid last name (at least 2 letters).');
      valid = false;
    }

    // Validate email
    if (!fields.email.value.trim() || !isValidEmail(fields.email.value)) {
      showError(fields.email, 'Enter a valid email address.');
      valid = false;
    }

    // Validate password
    const isEditing = signupForm.action.includes('/editUser/');
    if (!fields.password.value.trim() && !isEditing) {
      showError(fields.password, 'Enter a password for the new user.');
      valid = false;
    }

    // Validate role selection
    if (!fields.role.value || fields.role.value === 'Select Role') {
      showError(fields.role, 'Select a user role.');
      valid = false;
    }

    // Validate branch selection if the role isn't 'director'
    if (fields.role.value !== 'director' && (!fields.branch.value || fields.branch.value === 'Select Branch')) {
      showError(fields.branch, 'Select a branch for the user.');
      valid = false;
    }

    // If validation fails, prevent form submission
    if (!valid) {
      e.preventDefault();
    }
  });
});
