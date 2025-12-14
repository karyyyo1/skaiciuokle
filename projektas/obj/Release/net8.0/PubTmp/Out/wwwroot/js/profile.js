// Profile page functionality

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    await loadUserProfile();
    setupEventListeners();
});

// Load user profile information
async function loadUserProfile() {
    try {
        const user = getCurrentUser();
        
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        // Display user information
        document.getElementById('profileUsername').textContent = user.username || 'N/A';
        document.getElementById('profileEmail').textContent = user.email || 'N/A';
        
        // Display role
        const roleText = getRoleText(user.role);
        document.getElementById('profileRole').textContent = roleText;
        document.getElementById('profileRole').className = `badge badge-${getRoleBadgeClass(user.role)}`;

    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error loading profile: ' + error.message, 'error');
    }
}

// Get role text
function getRoleText(role) {
    if (typeof role === 'number') {
        const roleMap = { 1: 'Admin', 2: 'Manager', 3: 'Client' };
        return roleMap[role] || 'Unknown';
    }
    if (typeof role === 'string') {
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    }
    return 'Unknown';
}

// Get role badge class
function getRoleBadgeClass(role) {
    if (role === 1 || role === '1' || role === 'admin') return 'admin';
    if (role === 2 || role === '2' || role === 'manager') return 'manager';
    return 'client';
}

// Setup event listeners
function setupEventListeners() {
    // Update Username Form
    document.getElementById('updateUsernameForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateUsername();
    });

    // Update Password Form
    document.getElementById('updatePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updatePassword();
    });
}

// Update username
async function updateUsername() {
    const newUsername = document.getElementById('newUsername').value.trim();

    if (!newUsername) {
        showToast('Please enter a new username', 'error');
        return;
    }

    if (newUsername.length < 3) {
        showToast('Username must be at least 3 characters', 'error');
        return;
    }
    try {
        const user = getCurrentUser();
        
        if (!user || !user.id) {
            showToast('User not logged in', 'error');
            return;
        }
        console.log('Updating username for user ID:', user.id);
        
        const response = await api.put(`/api/users/${user.id}`, {
            Username: newUsername
        });
        // Update local storage
        user.username = newUsername;
        localStorage.setItem('user', JSON.stringify(user));
        // Update display
        document.getElementById('profileUsername').textContent = newUsername;
        document.getElementById('newUsername').value = '';

        showToast('Username updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating username:', error);
        console.error('Error details:', error);
        showToast('Error updating username: ' + error.message, 'error');
    }
}

// Update password
async function updatePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill in all password fields', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('New password must be at least 6 characters', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }

    if (currentPassword === newPassword) {
        showToast('New password must be different from current password', 'error');
        return;
    }

    try {
        const user = getCurrentUser();
        
        if (!user || !user.id) {
            showToast('User not logged in', 'error');
            return;
        }
        
        console.log('Changing password for user ID:', user.id);
        
        const response = await api.put(`/api/users/${user.id}/password`, {
            CurrentPassword: currentPassword,
            NewPassword: newPassword,
            ConfirmPassword: confirmPassword
        });

        // Clear form
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';

        showToast('Password changed successfully!', 'success');
    } catch (error) {
        console.error('Error changing password:', error);
        console.error('Error details:', error);
        showToast('Error changing password: ' + error.message, 'error');
    }
}
