// API Configuration and Helper Functions
const API_BASE_URL = window.location.origin;

// API Helper Class
class API {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    // Get auth token from localStorage
    getToken() {
        return localStorage.getItem('token');
    }

    // Get auth headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders(options.auth !== false)
        };

        console.log(`API Request: ${options.method || 'GET'} ${endpoint}`, {
            auth: options.auth !== false,
            hasToken: !!this.getToken()
        });

        try {
            const response = await fetch(url, config);
            console.log(`API Response: ${endpoint} - Status ${response.status}`);
            
            // Handle different status codes
            if (response.status === 401) {
                console.error('401 Unauthorized for:', endpoint);
                // Unauthorized - only redirect if we're requiring auth
                if (options.auth !== false) {
                    console.log('Clearing token and redirecting to login...');
                    // Clear invalid token
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    
                    // Only redirect if not already on login/register page
                    if (!window.location.pathname.includes('login') && 
                        !window.location.pathname.includes('register')) {
                        console.log('Redirecting to login page...');
                        setTimeout(() => {
                            window.location.href = '/login.html';
                        }, 100);
                    }
                }
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(error.message || `Request failed with status ${response.status}`);
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, auth = true) {
        return this.request(endpoint, { method: 'GET', auth });
    }

    // POST request
    async post(endpoint, data, auth = true) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            auth
        });
    }

    // PUT request
    async put(endpoint, data, auth = true) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            auth
        });
    }

    // DELETE request
    async delete(endpoint, auth = true) {
        return this.request(endpoint, { method: 'DELETE', auth });
    }

    // Authentication Methods
    async login(email, password) {
        const response = await this.post('/api/auth/login', { email, password }, false);
        console.log('Login API response:', response);
        
        // Handle both PascalCase and camelCase
        const token = response.Token || response.token;
        const userId = response.UserId || response.userId;
        const username = response.Username || response.username;
        const userEmail = response.Email || response.email;
        const role = response.Role || response.role;
        
        if (token) {
            console.log('Storing login token...');
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({
                id: userId,
                username: username,
                email: userEmail,
                role: role
            }));
            console.log('Login token stored successfully');
        } else {
            console.error('No token in login response!', response);
        }
        return response;
    }

    async register(username, email, password, confirmPassword) {
        console.log('API.register called with:', { username, email });
        const response = await this.post('/api/auth/register', {
            username,
            email,
            password,
            confirmPassword
        }, false);
        console.log('Register API response:', response);
        
        // Handle both PascalCase and camelCase
        const token = response.Token || response.token;
        const userId = response.UserId || response.userId;
        const responseUsername = response.Username || response.username;
        const responseEmail = response.Email || response.email;
        const role = response.Role || response.role;
        
        console.log('Response has token:', !!token);
        
        if (token) {
            console.log('Storing token in localStorage...');
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({
                id: userId,
                username: responseUsername,
                email: responseEmail,
                role: role
            }));
            console.log('Token stored successfully');
        } else {
            console.error('No token in response!', response);
        }
        return response;
    }

    async getCurrentUser() {
        return this.get('/api/auth/me');
    }

    async getClientId() {
        return this.get('/api/auth/client-id');
    }

    // Products API
    async getProducts() {
        return this.get('/api/products', false); // Public endpoint
    }

    async getProduct(id) {
        return this.get(`/api/products/${id}`, false);
    }

    async createProduct(data) {
        return this.post('/api/products', data);
    }

    async updateProduct(id, data) {
        return this.put(`/api/products/${id}`, data);
    }

    async deleteProduct(id) {
        return this.delete(`/api/products/${id}`);
    }

    // Jobs API
    async getJobs() {
        return this.get('/api/jobs', false); // Public endpoint
    }

    async getJob(id) {
        return this.get(`/api/jobs/${id}`, false);
    }

    async createJob(data) {
        return this.post('/api/jobs', data);
    }

    async updateJob(id, data) {
        return this.put(`/api/jobs/${id}`, data);
    }

    async deleteJob(id) {
        return this.delete(`/api/jobs/${id}`);
    }

    // Orders API
    async getOrders() {
        return this.get('/api/orders');
    }

    async getOrder(id) {
        return this.get(`/api/orders/${id}`);
    }

    async createOrder(data) {
        return this.post('/api/orders', data);
    }

    async updateOrder(id, data) {
        return this.put(`/api/orders/${id}`, data);
    }

    async deleteOrder(id) {
        return this.delete(`/api/orders/${id}`);
    }

    // Documents API
    async getDocuments() {
        return this.get('/api/documents');
    }

    async getDocument(id) {
        return this.get(`/api/documents/${id}`);
    }

    async createDocument(data) {
        return this.post('/api/documents', data);
    }

    async updateDocument(id, data) {
        return this.put(`/api/documents/${id}`, data);
    }

    async deleteDocument(id) {
        return this.delete(`/api/documents/${id}`);
    }

    // Comments API
    async getComments() {
        return this.get('/api/comments');
    }

    async getComment(id) {
        return this.get(`/api/comments/${id}`);
    }

    async createComment(data) {
        return this.post('/api/comments', data);
    }

    async updateComment(id, data) {
        return this.put(`/api/comments/${id}`, data);
    }

    async deleteComment(id) {
        return this.delete(`/api/comments/${id}`);
    }

    // Users API (Admin only)
    async getUsers() {
        return this.get('/api/users');
    }

    async getUser(id) {
        return this.get(`/api/users/${id}`);
    }
}

// Create global API instance
const api = new API();

// Utility Functions
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    toast.classList.remove('error', 'show');
    
    if (type === 'error') {
        toast.classList.add('error');
        icon.className = 'fas fa-exclamation-circle';
    } else {
        icon.className = 'fas fa-check-circle';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

function getStatusText(status) {
    const statusMap = {
        1: 'Pending',
        2: 'Processing',
        3: 'Completed',
        4: 'Cancelled'
    };
    return statusMap[status] || 'Unknown';
}

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}
