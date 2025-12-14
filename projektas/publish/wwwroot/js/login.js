// Login Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (isAuthenticated()) {
        window.location.href = '/index.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = togglePassword.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });

    // Form validation
    function validateForm() {
        let isValid = true;
        
        // Email validation
        const emailError = document.getElementById('emailError');
        if (!emailInput.value.trim()) {
            emailError.textContent = 'Email is required';
            isValid = false;
        } else if (!isValidEmail(emailInput.value)) {
            emailError.textContent = 'Please enter a valid email';
            isValid = false;
        } else {
            emailError.textContent = '';
        }

        // Password validation
        const passwordError = document.getElementById('passwordError');
        if (!passwordInput.value.trim()) {
            passwordError.textContent = 'Password is required';
            isValid = false;
        } else {
            passwordError.textContent = '';
        }

        return isValid;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Show loading state
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;

        try {
            const response = await api.login(email, password);
            
            showToast('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        } catch (error) {
            showToast(error.message || 'Login failed. Please check your credentials.', 'error');
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    });

    // Clear errors on input
    emailInput.addEventListener('input', () => {
        document.getElementById('emailError').textContent = '';
    });

    passwordInput.addEventListener('input', () => {
        document.getElementById('passwordError').textContent = '';
    });
});
