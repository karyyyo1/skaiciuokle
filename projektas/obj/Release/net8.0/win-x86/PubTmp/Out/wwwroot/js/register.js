// Register Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (isAuthenticated()) {
        window.location.href = '/index.html';
        return;
    }

    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const registerBtn = document.getElementById('registerBtn');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = togglePassword.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });

    toggleConfirmPassword.addEventListener('click', () => {
        const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
        confirmPasswordInput.type = type;
        
        const icon = toggleConfirmPassword.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });

    // Form validation
    function validateForm() {
        let isValid = true;
        
        // Username validation
        const usernameError = document.getElementById('usernameError');
        if (!usernameInput.value.trim()) {
            usernameError.textContent = 'Username is required';
            isValid = false;
        } else if (usernameInput.value.length < 3) {
            usernameError.textContent = 'Username must be at least 3 characters';
            isValid = false;
        } else {
            usernameError.textContent = '';
        }

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
        if (!passwordInput.value) {
            passwordError.textContent = 'Password is required';
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters';
            isValid = false;
        } else {
            passwordError.textContent = '';
        }

        // Confirm password validation
        const confirmPasswordError = document.getElementById('confirmPasswordError');
        if (!confirmPasswordInput.value) {
            confirmPasswordError.textContent = 'Please confirm your password';
            isValid = false;
        } else if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordError.textContent = 'Passwords do not match';
            isValid = false;
        } else {
            confirmPasswordError.textContent = '';
        }

        return isValid;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Handle form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Show loading state
        registerBtn.classList.add('loading');
        registerBtn.disabled = true;

        try {
            console.log('Starting registration...');
            const response = await api.register(username, email, password, confirmPassword);
            console.log('Registration response:', response);
            
            // Verify token was stored
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            console.log('Token stored:', !!storedToken);
            console.log('User stored:', !!storedUser);
            
            if (!storedToken) {
                throw new Error('Token was not stored after registration');
            }
            
            showToast('Registration successful! Redirecting...', 'success');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                console.log('Redirecting to dashboard...');
                window.location.href = '/index.html';
            }, 1000);
        } catch (error) {
            console.error('Registration error:', error);
            showToast(error.message || 'Registration failed. Please try again.', 'error');
            registerBtn.classList.remove('loading');
            registerBtn.disabled = false;
        }
    });

    // Clear errors on input
    usernameInput.addEventListener('input', () => {
        document.getElementById('usernameError').textContent = '';
    });

    emailInput.addEventListener('input', () => {
        document.getElementById('emailError').textContent = '';
    });

    passwordInput.addEventListener('input', () => {
        document.getElementById('passwordError').textContent = '';
        if (confirmPasswordInput.value) {
            validateForm();
        }
    });

    confirmPasswordInput.addEventListener('input', () => {
        document.getElementById('confirmPasswordError').textContent = '';
    });
});
