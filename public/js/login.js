document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", function (event) {
        event.preventDefault();  // Prevent form submission for validation

        // Clear any previous error messages
        document.getElementById("emailError").classList.add("hidden");
        document.getElementById("passwordError").classList.add("hidden");

        let isValid = true;  // Track validity of the form

        // Email validation (Strict Email Format)
        const email = document.getElementById("email").value;
        const emailError = document.getElementById("emailError");

        if (!email) {
            emailError.textContent = "Email is required.";
            emailError.classList.remove("hidden");
            isValid = false;
        } else {
            // Strict email validation pattern (including basic domain validation)
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

            if (!emailPattern.test(email)) {
                emailError.textContent = "Please enter a valid email address in the correct format (e.g., user@example.com).";
                emailError.classList.remove("hidden");
                isValid = false;
            }
        }

        // Password validation
        const password = document.getElementById("password").value;
        const passwordError = document.getElementById("passwordError");

        if (!password) {
            passwordError.textContent = "Password is required.";
            passwordError.classList.remove("hidden");
            isValid = false;
        } else if (password.length < 3) {
            passwordError.textContent = "Password must be at least 6 characters long.";
            passwordError.classList.remove("hidden");
            isValid = false;
        }

        // If the form is valid, submit it
        if (isValid) {
            form.submit();  // Proceed with form submission
        }
    });
});
