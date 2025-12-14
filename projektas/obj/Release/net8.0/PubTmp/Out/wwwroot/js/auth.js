// Authentication Helper Functions

// This file is included in pages that need authentication
// It provides utility functions for checking auth status

// Check authentication on page load
(function() {
    const publicPages = ['/login.html', '/register.html'];
    const currentPage = window.location.pathname;
    
    // If on a public page and already authenticated, redirect to dashboard
    if (publicPages.some(page => currentPage.endsWith(page))) {
        if (isAuthenticated()) {
            window.location.href = '/index.html';
        }
    }
})();

// Auto-logout on token expiration
function checkTokenExpiration() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        // Decode JWT token
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        const expiration = payload.exp * 1000; // Convert to milliseconds
        
        // Check if token is expired
        if (Date.now() >= expiration) {
            logout();
        }
    } catch (error) {
        console.error('Error checking token expiration:', error);
    }
}

// Check token expiration every minute
setInterval(checkTokenExpiration, 60000);

// Check on page load
checkTokenExpiration();
