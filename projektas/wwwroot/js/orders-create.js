// API instance is already created in api.js
// No need to redeclare it here

// State management
let selectedItems = [];
let comments = [];
let documents = [];
let allProducts = [];
let allJobs = [];
let editingOrderId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    
    // Check if we're editing an existing order
    const urlParams = new URLSearchParams(window.location.search);
    editingOrderId = urlParams.get('id');
    
    // Load all data first
    await Promise.all([
        loadUsers(),
        loadManagers(),
        loadProducts()
    ]);
    
    // Load existing order data if editing (after dropdowns are populated)
    if (editingOrderId) {
        await loadExistingOrder(editingOrderId);
        document.querySelector('.order-form-header h1').innerHTML = '<i class="fas fa-edit"></i> Edit Order #' + editingOrderId;
        document.querySelector('.order-form-header p').textContent = 'Modify products, jobs, comments and documents for this order';
        document.querySelector('.action-buttons .btn-primary').innerHTML = '<i class="fas fa-save"></i> Update Order';
    }
});

// Check authentication
async function checkAuth() {
    const token = localStorage.getItem('token');
    console.log('Token:', token ? 'exists' : 'missing');
    
    if (!token) {
        console.log('No token, redirecting to login');
        window.location.href = 'login.html';
        return false;
    }

    const user = getCurrentUser();
    console.log('Current user:', user);
    
    if (!user) {
        console.log('No user data, redirecting to index');
        showToast('Access denied. Admin or Manager role required.', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return false;
    }
    
    const userIsAdmin = isAdmin(user.role);
    const userIsManager = isManager(user.role);
    
    console.log('Role value:', user.role, 'Type:', typeof user.role);
    console.log('Is admin:', userIsAdmin, 'Is manager:', userIsManager);
    
    if (!userIsAdmin && !userIsManager) {
        console.log('User is not admin or manager, redirecting to index');
        showToast('Access denied. Admin or Manager role required.', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return false;
    }
    
    console.log('Auth check passed');
    return true;
}

// Get current user from token
function getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT Payload:', payload);
        
        // Try different possible claim names
        const userId = payload.nameid || payload.sub || payload.userId || payload.UserId || 
                       payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        const userEmail = payload.email || payload.Email || 
                         payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
        const userRole = payload.role || payload.Role || 
                        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        const userName = payload.unique_name || payload.name || payload.username || payload.Username ||
                        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
        
        return {
            id: parseInt(userId),
            email: userEmail,
            role: userRole,
            username: userName
        };
    } catch (error) {
        console.error('Error parsing token:', error);
        return null;
    }
}

// Helper function to check if user is admin
function isAdmin(role) {
    if (typeof role === 'number') {
        return role === 1; // admin = 1
    }
    if (typeof role === 'string') {
        const roleLower = role.toLowerCase();
        return roleLower === 'admin' || roleLower === 'administrator' || role === '1';
    }
    return false;
}

// Helper function to check if user is manager
function isManager(role) {
    if (typeof role === 'number') {
        return role === 2; // manager = 2
    }
    if (typeof role === 'string') {
        const roleLower = role.toLowerCase();
        return roleLower === 'manager' || role === '2';
    }
    return false;
}

// Load users
async function loadUsers() {
    const select = document.getElementById('userSelect');
    try {
        console.log('Loading users...');
        const users = await api.getUsers();
        console.log('Users loaded:', users);
        
        if (!users || users.length === 0) {
            select.innerHTML = '<option value="">No users available</option>';
            return;
        }
        
        select.innerHTML = '<option value="">Select a user</option>' +
            users.map(u => `<option value="${u.Id || u.id}">${escapeHtml(u.Email || u.email)} (${escapeHtml(u.Username || u.username)})</option>`).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        select.innerHTML = '<option value="">Error loading users</option>';
        showToast('Error loading users: ' + error.message, 'error');
    }
}

// Load managers
async function loadManagers() {
    const select = document.getElementById('managerSelect');
    try {
        console.log('Loading managers...');
        const managers = await api.get('/api/manager');
        console.log('Managers loaded:', managers);
        
        if (!managers || managers.length === 0) {
            select.innerHTML = '<option value="">No managers available</option>';
            return;
        }
        
        select.innerHTML = '<option value="">Select a manager</option>' +
            managers.map(m => {
                // Use UserId (which references users.id), not manager table Id
                const managerUserId = m.UserId || m.userId;
                const managerName = m.User?.Username || m.User?.username || `Manager ${managerUserId}`;
                return `<option value="${managerUserId}">${escapeHtml(managerName)}</option>`;
            }).join('');
    } catch (error) {
        console.error('Error loading managers:', error);
        select.innerHTML = '<option value="">Error loading managers</option>';
        showToast('Error loading managers: ' + error.message, 'error');
    }
}

// Load products and jobs
async function loadProducts() {
    try {
        console.log('Loading products and jobs...');
        const [products, jobs] = await Promise.all([
            api.getProducts(),
            api.getJobs()
        ]);
        console.log('Products loaded:', products);
        console.log('Jobs loaded:', jobs);
        
        allProducts = products || [];
        allJobs = jobs || [];
        
        console.log('Products:', allProducts.length, 'Jobs:', allJobs.length);
        
        renderProductsCatalog();
        renderJobsCatalog();
    } catch (error) {
        console.error('Error loading products and jobs:', error);
        document.getElementById('productsCatalog').innerHTML = '<p style="text-align: center; color: red;">Error loading products</p>';
        document.getElementById('jobsCatalog').innerHTML = '<p style="text-align: center; color: red;">Error loading jobs</p>';
        showToast('Error loading products and jobs: ' + error.message, 'error');
    }
}

// Render products catalog
function renderProductsCatalog() {
    const container = document.getElementById('productsCatalog');
    
    if (allProducts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No products available</p>';
        return;
    }

    container.innerHTML = allProducts.map(p => {
        const productId = p.Id || p.id;
        const isSelected = selectedItems.find(item => item.id === productId);
        
        return `
            <div class="catalog-item ${isSelected ? 'selected' : ''}" onclick="toggleItem(${productId}, 'product')">
                <h3>${escapeHtml(p.Name || p.name)}</h3>
                <div class="price">${formatCurrency(p.Price || p.price)}</div>
                <p style="font-size: 0.9rem; color: #666;">${escapeHtml((p.Description || p.description || '').substring(0, 80))}${(p.Description || p.description || '').length > 80 ? '...' : ''}</p>
                ${isSelected ? `
                    <div class="quantity-control" onclick="event.stopPropagation()">
                        <label>Quantity:</label>
                        <input type="number" min="1" value="${isSelected.quantity}" 
                               onchange="updateQuantity(${productId}, this.value)" 
                               onclick="event.stopPropagation()">
                    </div>
                    <div class="done-checkbox" onclick="event.stopPropagation()">
                        <input type="checkbox" id="done-${productId}" 
                               ${isSelected.done ? 'checked' : ''}
                               onchange="updateDone(${productId}, this.checked)">
                        <label for="done-${productId}">Mark as done</label>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Render jobs catalog
function renderJobsCatalog() {
    const container = document.getElementById('jobsCatalog');
    
    if (allJobs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No jobs available</p>';
        return;
    }

    container.innerHTML = allJobs.map(j => {
        const jobId = j.Id || j.id;
        const isSelected = selectedItems.find(item => item.id === jobId);
        
        return `
            <div class="catalog-item ${isSelected ? 'selected' : ''}" onclick="toggleItem(${jobId}, 'job')">
                <h3>${escapeHtml(j.Name || j.name)}</h3>
                <div class="price">${formatCurrency(j.Price || j.price)}</div>
                <p style="font-size: 0.9rem; color: #666;">${escapeHtml((j.Description || j.description || '').substring(0, 80))}${(j.Description || j.description || '').length > 80 ? '...' : ''}</p>
                ${isSelected ? `
                    <div class="quantity-control" onclick="event.stopPropagation()">
                        <label>Quantity:</label>
                        <input type="number" min="1" value="${isSelected.quantity}" 
                               onchange="updateQuantity(${jobId}, this.value)"
                               onclick="event.stopPropagation()">
                    </div>
                    <div class="done-checkbox" onclick="event.stopPropagation()">
                        <input type="checkbox" id="done-${jobId}" 
                               ${isSelected.done ? 'checked' : ''}
                               onchange="updateDone(${jobId}, this.checked)">
                        <label for="done-${jobId}">Mark as done</label>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Toggle item selection
function toggleItem(itemId, type) {
    const existingIndex = selectedItems.findIndex(item => item.id === itemId);
    
    if (existingIndex >= 0) {
        selectedItems.splice(existingIndex, 1);
    } else {
        const allItems = [...allProducts, ...allJobs];
        const item = allItems.find(p => (p.Id || p.id) === itemId);
        
        if (item) {
            selectedItems.push({
                id: itemId,
                name: item.Name || item.name,
                price: item.Price || item.price,
                quantity: 1,
                done: false,
                type: type
            });
        }
    }
    
    renderProductsCatalog();
    renderJobsCatalog();
    updateSummary();
}

// Update quantity
function updateQuantity(itemId, quantity) {
    const item = selectedItems.find(item => item.id === itemId);
    if (item) {
        item.quantity = parseInt(quantity) || 1;
        updateSummary();
    }
}

// Update done status
function updateDone(itemId, done) {
    const item = selectedItems.find(item => item.id === itemId);
    if (item) {
        item.done = done;
    }
}

// Update summary
function updateSummary() {
    const listContainer = document.getElementById('selectedItemsList');
    const totalPriceElement = document.getElementById('totalPrice');
    
    if (selectedItems.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #999;">No items selected</p>';
        totalPriceElement.textContent = '€0.00';
        return;
    }
    
    let total = 0;
    listContainer.innerHTML = selectedItems.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        return `
            <div class="selected-item">
                <div>
                    <strong>${escapeHtml(item.name)}</strong><br>
                    <small>${item.quantity} × ${formatCurrency(item.price)} ${item.done ? '✓ Done' : ''}</small>
                </div>
                <div style="text-align: right;">
                    ${formatCurrency(subtotal)}
                </div>
            </div>
        `;
    }).join('');
    
    totalPriceElement.textContent = formatCurrency(total);
}

// Add comment
function addComment() {
    const text = prompt('Enter comment text:');
    if (text && text.trim()) {
        comments.push({ text: text.trim() });
        renderComments();
    }
}

// Render comments
function renderComments() {
    const container = document.getElementById('commentsList');
    
    if (comments.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = comments.map((comment, index) => `
        <div class="comment-item">
            <button class="remove-btn" onclick="removeComment(${index})">
                <i class="fas fa-times"></i>
            </button>
            <p>${escapeHtml(comment.text)}</p>
        </div>
    `).join('');
}

// Remove comment
function removeComment(index) {
    comments.splice(index, 1);
    renderComments();
}

// Add document
function addDocument() {
    const name = prompt('Enter document name:');
    if (!name || !name.trim()) return;
    
    const filePath = prompt('Enter file path:');
    if (!filePath || !filePath.trim()) return;
    
    documents.push({ name: name.trim(), filePath: filePath.trim() });
    renderDocuments();
}

// Render documents
function renderDocuments() {
    const container = document.getElementById('documentsList');
    
    if (documents.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = documents.map((doc, index) => `
        <div class="document-item">
            <button class="remove-btn" onclick="removeDocument(${index})">
                <i class="fas fa-times"></i>
            </button>
            <p><strong>${escapeHtml(doc.name)}</strong></p>
            <small>${escapeHtml(doc.filePath)}</small>
        </div>
    `).join('');
}

// Remove document
function removeDocument(index) {
    documents.splice(index, 1);
    renderDocuments();
}

// Load existing order for editing
async function loadExistingOrder(orderId) {
    try {
        const order = await api.getOrder(orderId);
        
        // Set form values
        document.getElementById('userSelect').value = order.UserId || order.userId;
        document.getElementById('managerSelect').value = order.ManagerId || order.managerId;
        document.getElementById('statusSelect').value = order.Status || order.status;
        
        // Load order products
        const orderProducts = order.OrderProducts || order.orderProducts || [];
        orderProducts.forEach(op => {
            const productId = op.ProductId || op.productId;
            const quantity = op.Quantity || op.quantity || 1;
            const done = op.Done || op.done || false;
            
            const allItems = [...allProducts, ...allJobs];
            const item = allItems.find(p => (p.Id || p.id) === productId);
            
            if (item) {
                selectedItems.push({
                    id: productId,
                    name: item.Name || item.name,
                    price: item.Price || item.price,
                    quantity: quantity,
                    done: done,
                    type: (item.Type || item.type) === 7 ? 'job' : 'product'
                });
            }
        });
        
        renderProductsCatalog();
        renderJobsCatalog();
        updateSummary();
        
        // Load existing comments for this order
        try {
            const allComments = await api.getComments();
            const orderComments = allComments.filter(c => (c.OrderId || c.orderId) == orderId);
            comments = orderComments.map(c => ({ text: c.Text || c.text, id: c.Id || c.id }));
            renderComments();
        } catch (error) {
            console.error('Error loading comments:', error);
        }
        
        // Load existing documents for this order
        try {
            const allDocuments = await api.getDocuments();
            const orderDocuments = allDocuments.filter(d => (d.OrderId || d.orderId) == orderId);
            documents = orderDocuments.map(d => ({ 
                name: d.Name || d.name, 
                filePath: d.FilePath || d.filePath,
                id: d.Id || d.id 
            }));
            renderDocuments();
        } catch (error) {
            console.error('Error loading documents:', error);
        }
        
    } catch (error) {
        showToast('Error loading order: ' + error.message, 'error');
    }
}

// Create or update order
async function createOrder() {
    const userId = parseInt(document.getElementById('userSelect').value);
    const managerId = parseInt(document.getElementById('managerSelect').value);
    const status = parseInt(document.getElementById('statusSelect').value);
    
    // Validation
    if (!userId) {
        showToast('Please select a user', 'error');
        return;
    }
    
    if (!managerId) {
        showToast('Please select a manager', 'error');
        return;
    }
    
    if (selectedItems.length === 0) {
        showToast('Please select at least one product or job', 'error');
        return;
    }
    
    // Calculate total price
    const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Separate products and jobs
    const products = selectedItems.filter(item => item.type === 'product');
    const jobs = selectedItems.filter(item => item.type === 'job');
    
    // Prepare order data
    const orderData = {
        UserId: userId,
        ManagerId: managerId,
        Status: status,
        TotalPrice: totalPrice,
        OrderProducts: products.map(item => ({
            ProductId: item.id,
            Quantity: item.quantity,
            Done: item.done
        })),
        OrderJobs: jobs.map(item => ({
            JobId: item.id,
            Price: item.price,
            Done: item.done
        }))
    };
    
    try {
        let orderId;
        
        if (editingOrderId) {
            // Update existing order
            await api.updateOrder(editingOrderId, orderData);
            orderId = editingOrderId;
            showToast('Order updated successfully!', 'success');
        } else {
            // Create new order
            const createdOrder = await api.createOrder(orderData);
            orderId = createdOrder.Id || createdOrder.id;
            showToast('Order created successfully!', 'success');
        }
        
        // Add new comments (only those without an id)
        const currentUser = getCurrentUser();
        for (const comment of comments) {
            if (!comment.id) {
                try {
                    await api.createComment({
                        UserId: currentUser.id,
                        OrderId: orderId,
                        Text: comment.text
                    });
                } catch (error) {
                    console.error('Error adding comment:', error);
                }
            }
        }
        
        // Add new documents (only those without an id)
        for (const doc of documents) {
            if (!doc.id) {
                try {
                    await api.createDocument({
                        OrderId: orderId,
                        Name: doc.name,
                        FilePath: doc.filePath
                    });
                } catch (error) {
                    console.error('Error adding document:', error);
                }
            }
        }
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = 'index.html#orders';
        }, 1500);
        
    } catch (error) {
        showToast(`Error ${editingOrderId ? 'updating' : 'creating'} order: ` + error.message, 'error');
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount || 0);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return (text || '').toString().replace(/[&<>"']/g, m => map[m]);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Delete comment from order
async function deleteOrderComment(commentId, orderId) {
    if (confirm('Are you sure you want to delete this comment?')) {
        try {
            await api.deleteComment(commentId);
            showToast('Comment deleted successfully!', 'success');
            // Reload the order to refresh the view
            if (editingOrderId) {
                await loadExistingOrder(editingOrderId);
            }
        } catch (error) {
            showToast('Error deleting comment: ' + error.message, 'error');
        }
    }
}

// Delete document from order
async function deleteOrderDocument(documentId, orderId) {
    if (confirm('Are you sure you want to delete this document?')) {
        try {
            await api.deleteDocument(documentId);
            showToast('Document deleted successfully!', 'success');
            // Reload the order to refresh the view
            if (editingOrderId) {
                await loadExistingOrder(editingOrderId);
            }
        } catch (error) {
            showToast('Error deleting document: ' + error.message, 'error');
        }
    }
}
