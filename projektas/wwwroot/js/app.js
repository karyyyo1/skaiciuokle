// Main Application JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Initialize app
    initializeApp();
});

// Helper function to check if user is admin
function isAdmin(role) {
    // Handle both numeric (1) and string ('admin') roles
    // Backend returns: 'admin', 'manager', or 'client' as strings
    if (typeof role === 'number') {
        return role === 1; // admin = 1
    }
    if (typeof role === 'string') {
        const roleLower = role.toLowerCase();
        return roleLower === 'admin' || roleLower === 'administrator' || role === '1';
    }
    return false;
}

// Apply role-based visibility
function applyRoleBasedVisibility(role) {
    const body = document.body;
    
    console.log('=== Role-based visibility check ===');
    console.log('Role value:', role);
    console.log('Role type:', typeof role);
    console.log('Is admin?', isAdmin(role));
    
    if (isAdmin(role)) {
        body.classList.add('role-admin');
        console.log('✓ User is admin - showing all sections');
        console.log('Body classes:', body.className);
    } else {
        body.classList.remove('role-admin');
        console.log('✗ User is NOT admin - showing only orders');
        console.log('Body classes:', body.className);
        
        // Set orders as active navigation for clients
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === 'orders') {
                link.classList.add('active');
            }
        });
    }
}

function initializeApp() {
    const user = getCurrentUser();
    console.log('Initializing app for user:', user);
    console.log('Token exists:', !!localStorage.getItem('token'));
    
    // Set user info
    document.getElementById('userName').textContent = user.username;
    document.getElementById('dashboardUserName').textContent = user.username;

    // Apply role-based visibility
    applyRoleBasedVisibility(user.role);

    // Setup navigation
    setupNavigation();
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Setup profile button
    document.getElementById('profileBtn').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/profile.html';
    });
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Load dashboard stats (only for admins)
    if (isAdmin(user.role)) {
        console.log('Loading dashboard stats...');
        loadDashboardStats();
    } else {
        // For clients, show orders page by default
        showPage('orders');
    }

    // Setup modal
    setupModal();

    // Setup action buttons
    setupActionButtons();
}

// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            
            // Update active states
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show selected page
            showPage(page);
            
            // Close mobile menu
            closeMobileMenu();
        });
    });
}

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    // Show selected page
    const page = document.getElementById(`${pageName}Page`);
    if (page) {
        page.classList.add('active');
        
        // Load data for the page
        loadPageData(pageName);
    }
}

function loadPageData(pageName) {
    switch (pageName) {
        case 'products':
            loadProducts();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'documents':
            loadDocuments();
            break;
        case 'comments':
            loadComments();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

// Mobile Menu
function setupMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        mobileNav.classList.toggle('active');
    });
}

function closeMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    
    toggle.classList.remove('active');
    mobileNav.classList.remove('active');
}

// Dashboard Stats
async function loadDashboardStats() {
    console.log('loadDashboardStats called');
    try {
        // Try to load products (public endpoint)
        console.log('Fetching products...');
        const products = await api.getProducts().catch(err => {
            console.error('Products fetch failed:', err);
            return [];
        });
        console.log('Products loaded:', products.length);
        document.getElementById('totalProducts').textContent = products.length || 0;
        
        // Try to load authenticated data
        try {
            console.log('Fetching authenticated data...');
            const [orders, documents, comments] = await Promise.all([
                api.getOrders().catch(err => {
                    console.error('Orders fetch failed:', err);
                    return [];
                }),
                api.getDocuments().catch(err => {
                    console.error('Documents fetch failed:', err);
                    return [];
                }),
                api.getComments().catch(err => {
                    console.error('Comments fetch failed:', err);
                    return [];
                })
            ]);
            
            console.log('Data loaded - Orders:', orders.length, 'Docs:', documents.length, 'Comments:', comments.length);
            document.getElementById('totalOrders').textContent = orders.length || 0;
            document.getElementById('totalDocuments').textContent = documents.length || 0;
            document.getElementById('totalComments').textContent = comments.length || 0;
        } catch (authError) {
            console.warn('Could not load authenticated stats:', authError);
            // Set to 0 if can't load
            document.getElementById('totalOrders').textContent = '0';
            document.getElementById('totalDocuments').textContent = '0';
            document.getElementById('totalComments').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Don't fail the whole page, just show 0s
        document.getElementById('totalProducts').textContent = '0';
        document.getElementById('totalOrders').textContent = '0';
        document.getElementById('totalDocuments').textContent = '0';
        document.getElementById('totalComments').textContent = '0';
    }
}

// Products Management
async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
        const products = await api.getProducts();
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px;">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.Id || product.id}</td>
                <td>${escapeHtml(product.Name || product.name)}</td>
                <td>${escapeHtml(product.Description || product.description || 'N/A')}</td>
                <td>${formatCurrency(product.Price || product.price)}</td>
                <td>${product.Type || product.type || 'N/A'}</td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--danger-color);">Error loading products</td></tr>';
        showToast('Error loading products: ' + error.message, 'error');
    }
}

// Orders Management
async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    const user = getCurrentUser();
    const isAdmin = user && (user.role === 'admin' || user.role === 1 || user.role === '1');
    const isManager = user && (user.role === 'manager' || user.role === 2 || user.role === '2' || user.role === 'Manager');
    const isAdminOrManager = isAdmin || isManager;
    const colspan = isAdminOrManager ? 6 : 4;
    
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>`;

    try {
        const orders = await api.getOrders();
        
        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center; padding: 40px;">No orders found</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(order => {
            const status = order.Status || order.status;
            const statusText = getStatusText(status);
            const totalPrice = order.TotalPrice ?? order.totalPrice ?? 0;
            const managerName = order.ManagerName || order.managerName || 'Not assigned';
            const userEmail = order.UserEmail || order.userEmail || 'N/A';
            const orderId = order.Id || order.id;
            
            return `
            <tr>
                ${isAdminOrManager ? `<td class="admin-only">${orderId}</td>` : ''}
                ${isAdminOrManager ? `<td class="admin-only">${escapeHtml(userEmail)}</td>` : ''}
                <td>${managerName}</td>
                <td><span class="badge">${statusText}</span></td>
                <td>${formatCurrency(totalPrice)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewOrder(${orderId})" title="View Order">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${isAdminOrManager ? `
                    <button class="btn btn-sm btn-warning" onclick="editOrderPage(${orderId})" title="Edit Order">
                        <i class="fas fa-edit"></i>
                    </button>
                    ` : ''}
                    <button class="btn btn-sm btn-warning" onclick="addCommentToOrder(${orderId})" title="Add Comment">
                        <i class="fas fa-comment"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="addDocumentToOrder(${orderId})" title="Add Document">
                        <i class="fas fa-file"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center; padding: 40px; color: var(--danger-color);">Error loading orders</td></tr>`;
        showToast('Error loading orders: ' + error.message, 'error');
    }
}

// Documents Management
async function loadDocuments() {
    const tbody = document.getElementById('documentsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
        const documents = await api.getDocuments();
        
        if (documents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;">No documents found</td></tr>';
            return;
        }

        tbody.innerHTML = documents.map(doc => `
            <tr>
                <td>${doc.Id || doc.id}</td>
                <td>${doc.OrderId || doc.orderId}</td>
                <td>${escapeHtml(doc.Name || doc.name)}</td>
                <td>${escapeHtml(doc.FilePath || doc.filePath)}</td>
                <td>${formatDate(doc.CreatedAt || doc.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewDocument(${doc.Id || doc.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editDocument(${doc.Id || doc.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDocumentConfirm(${doc.Id || doc.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--danger-color);">Error loading documents</td></tr>';
        showToast('Error loading documents: ' + error.message, 'error');
    }
}

// Comments Management
async function loadComments() {
    const tbody = document.getElementById('commentsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
        const comments = await api.getComments();
        
        if (comments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;">No comments found</td></tr>';
            return;
        }

        tbody.innerHTML = comments.map(comment => {
            const userEmail = comment.UserEmail || comment.userEmail || 'N/A';
            const orderId = comment.OrderId || comment.orderId || 'N/A';
            const managerName = comment.ManagerName || comment.managerName || 'Not assigned';
            const documentId = comment.DocumentId || comment.documentId || 'N/A';
            const text = escapeHtml((comment.Text || comment.text || '').substring(0, 50));
            
            return `
            <tr>
                <td>${escapeHtml(userEmail)}</td>
                <td>${orderId}</td>
                <td>${managerName}</td>
                <td>${documentId}</td>
                <td>${text}...</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewComment(${comment.Id || comment.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editComment(${comment.Id || comment.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCommentConfirm(${comment.Id || comment.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--danger-color);">Error loading comments</td></tr>';
        showToast('Error loading comments: ' + error.message, 'error');
    }
}

// Modal Functions
function setupModal() {
    const modal = document.getElementById('modal');
    const modalClose = document.getElementById('modalClose');
    
    modalClose.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function openModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
}

// Action Buttons Setup
function setupActionButtons() {
    document.getElementById('addProductBtn').addEventListener('click', () => {
        // Redirect to dedicated products management page for admins
        window.location.href = 'products.html';
    });
    document.getElementById('addOrderBtn').addEventListener('click', () => {
        // Show order form (admin/manager get full form, clients get simple form)
        showAddOrderForm();
    });
    document.getElementById('addDocumentBtn').addEventListener('click', showAddDocumentForm);
    document.getElementById('addCommentBtn').addEventListener('click', showAddCommentForm);
}

// Product Forms
function showAddProductForm() {
    const formHtml = `
        <form id="productForm" class="modal-form">
            <div class="form-group">
                <label for="productName">Product Name *</label>
                <input type="text" id="productName" required>
            </div>
            <div class="form-group">
                <label for="productDescription">Description</label>
                <textarea id="productDescription"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="productPrice">Price *</label>
                    <input type="number" id="productPrice" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label for="productQuantity">Quantity</label>
                    <input type="number" id="productQuantity" min="0" value="0">
                </div>
            </div>
            <div class="form-group">
                <label for="productType">Type *</label>
                <select id="productType" required>
                    <option value="">Select type</option>
                    <option value="0">Fence</option>
                    <option value="1">Gate Engine</option>
                    <option value="2">Access Control</option>
                    <option value="3">Jobs</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Create Product</button>
        </form>
    `;
    
    openModal('Add New Product', formHtml);
    
    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            Name: document.getElementById('productName').value,
            Description: document.getElementById('productDescription').value,
            Price: parseFloat(document.getElementById('productPrice').value),
            Quantity: parseInt(document.getElementById('productQuantity').value) || 0,
            Type: parseInt(document.getElementById('productType').value)
        };
        
        try {
            await api.createProduct(data);
            showToast('Product created successfully!', 'success');
            closeModal();
            loadProducts();
            loadDashboardStats();
        } catch (error) {
            showToast('Error creating product: ' + error.message, 'error');
        }
    });
}

// Similar functions for Orders, Documents, Comments...
async function showAddOrderForm() {
    const user = getCurrentUser();
    
    // Check if user is admin/manager or client
    if (isAdmin(user.role) || user.role === 'manager' || user.role === 'Manager' || user.role === 2 || user.role === '2') {
        // Admin/Manager: Show full form with products and jobs
        await showAdminOrderForm(user);
    } else {
        // Client: Show simple form with just comment
        showClientOrderForm(user);
    }
}

// Client order form - comment and documents
function showClientOrderForm(user) {
    const formHtml = `
        <form id="orderForm" class="modal-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="clientPhone">Phone Number *</label>
                    <input type="tel" id="clientPhone" required placeholder="+370 123 45678">
                </div>
                <div class="form-group">
                    <label for="clientAddress">Address *</label>
                    <input type="text" id="clientAddress" required placeholder="Your address">
                </div>
            </div>
            <div class="form-group">
                <label for="orderComment">Order Request/Comment *</label>
                <textarea id="orderComment" rows="6" required placeholder="Describe what you need for this order..."></textarea>
            </div>
            
            <div class="form-group">
                <label>
                    <i class="fas fa-file-upload"></i> Attach Documents (Optional)
                </label>
                <div id="documentsContainer" style="margin-top: 10px;">
                    <div class="document-input-row" style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <input type="text" class="doc-name" placeholder="Document name" style="flex: 1;">
                        <input type="text" class="doc-path" placeholder="File path or URL" style="flex: 2;">
                        <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-secondary" onclick="addDocumentRow()">
                    <i class="fas fa-plus"></i> Add Another Document
                </button>
            </div>
            
            <p class="info-text">
                <i class="fas fa-info-circle"></i> 
                A manager will review your request and add the necessary products and jobs to your order.
            </p>
            <button type="submit" class="btn btn-primary btn-block">Submit Order Request</button>
        </form>
    `;
    
    openModal('Create Order Request', formHtml);
    
    document.getElementById('orderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phoneNumber = document.getElementById('clientPhone').value;
        const address = document.getElementById('clientAddress').value;
        const comment = document.getElementById('orderComment').value;
        
        // Get user ID
        const userData = getCurrentUser();
        const userId = userData && userData.id ? userData.id : null;
        
        if (!userId) {
            showToast('Error: User not logged in', 'error');
            return;
        }
        
        console.log('Creating order - User ID:', userId);
        
        // Create order data
        const data = {
            UserId: parseInt(userId),
            ManagerId: null, // Will be assigned by admin/manager later
            Status: 1, // pending = 1
            TotalPrice: 0, // Will be calculated when products/jobs are added
            OrderProducts: [],
            OrderJobs: []
        };
        
        try {
            const order = await api.createOrder(data);
            const orderId = order.Id || order.id;
            
            // Create a comment for this order
            if (orderId) {
                const commentData = {
                    UserId: userId,
                    OrderId: orderId,
                    Text: comment
                };
                try {
                    await api.createComment(commentData);
                } catch (commentError) {
                    console.error('Error creating comment:', commentError);
                }
            }
            
            // Create documents for this order
            if (orderId) {
                const documentRows = document.querySelectorAll('.document-input-row');
                for (const row of documentRows) {
                    const docName = row.querySelector('.doc-name').value.trim();
                    const docPath = row.querySelector('.doc-path').value.trim();
                    
                    if (docName && docPath) {
                        try {
                            await api.createDocument({
                                OrderId: orderId,
                                Name: docName,
                                FilePath: docPath
                            });
                        } catch (docError) {
                            console.error('Error creating document:', docError);
                        }
                    }
                }
            }
            
            showToast('Order request submitted successfully!', 'success');
            closeModal();
            loadOrders();
        } catch (error) {
            showToast('Error creating order: ' + error.message, 'error');
        }
    });
}

// Admin/Manager order form - with products and jobs
async function showAdminOrderForm(user) {
    // Load products, jobs, users, and managers
    let products = [];
    let jobs = [];
    let users = [];
    let managers = [];
    try {
        [products, jobs, users, managers] = await Promise.all([
            api.getProducts(),
            api.getJobs(),
            api.getUsers(),
            api.get('/api/manager')
        ]);
    } catch (error) {
        showToast('Error loading data: ' + error.message, 'error');
        return;
    }
    
    // Filter users to show only clients
    const clients = users.filter(u => (u.Role || u.role) === 3 || (u.Role || u.role) === 'client');
    
    const formHtml = `
        <form id="orderForm" class="modal-form order-form-extended">
            <div class="form-row">
                <div class="form-group">
                    <label for="usersId">Select Client *</label>
                    <select id="usersId" required>
                        <option value="">-- Select Client --</option>
                        ${clients.map(c => `
                            <option value="${c.Id || c.id}">
                                ${escapeHtml(c.Email || c.email)} (${escapeHtml(c.Username || c.username)})
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="managerId">Assign Manager *</label>
                    <select id="managerId" required>
                        <option value="">-- Select Manager --</option>
                        ${managers.map(m => {
                            const managerUserId = m.UserId || m.userId;
                            const managerUsername = m.User?.Username || m.User?.username || `Manager ${managerUserId}`;
                            return `<option value="${managerUserId}">${escapeHtml(managerUsername)}</option>`;
                        }).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label for="orderStatus">Status *</label>
                <select id="orderStatus" required>
                    <option value="1">Pending</option>
                    <option value="2">Processing</option>
                    <option value="3">Completed</option>
                    <option value="4">Cancelled</option>
                </select>
            </div>
            
            <div class="order-tables-container">
                <div class="order-table-section">
                    <h3>Select Products</h3>
                    <div class="order-table-wrapper">
                        <table class="order-selection-table">
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>Name</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody id="productsSelectionBody">
                                ${products.map(p => `
                                    <tr>
                                        <td>
                                            <input type="checkbox" class="product-checkbox" data-id="${p.Id || p.id}" data-price="${p.Price || p.price}">
                                        </td>
                                        <td>${escapeHtml(p.Name || p.name)}</td>
                                        <td>${formatCurrency(p.Price || p.price)}</td>
                                        <td>
                                            <input type="number" class="product-quantity" data-id="${p.Id || p.id}" min="1" value="1" disabled>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${products.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No products available</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="order-table-section">
                    <h3>Select Jobs</h3>
                    <div class="order-table-wrapper">
                        <table class="order-selection-table">
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>Name</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody id="jobsSelectionBody">
                                ${jobs.map(j => `
                                    <tr>
                                        <td>
                                            <input type="checkbox" class="job-checkbox" data-id="${j.Id || j.id}" data-price="${j.Price || j.price}">
                                        </td>
                                        <td>${escapeHtml(j.Name || j.name)}</td>
                                        <td>${formatCurrency(j.Price || j.price)}</td>
                                        <td>
                                            <input type="number" class="job-quantity" data-id="${j.Id || j.id}" min="1" value="1" disabled>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${jobs.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No jobs available</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label>Total Price: <span id="calculatedTotal">€0.00</span></label>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">Create Order</button>
        </form>
    `;
    
    openModal('Create New Order', formHtml);
    
    // Enable/disable quantity inputs based on checkbox
    document.querySelectorAll('.product-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const productId = e.target.dataset.id;
            const quantityInput = document.querySelector(`.product-quantity[data-id="${productId}"]`);
            quantityInput.disabled = !e.target.checked;
            if (!e.target.checked) quantityInput.value = 1;
            calculateTotal();
        });
    });
    
    document.querySelectorAll('.job-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const jobId = e.target.dataset.id;
            const quantityInput = document.querySelector(`.job-quantity[data-id="${jobId}"]`);
            quantityInput.disabled = !e.target.checked;
            if (!e.target.checked) quantityInput.value = 1;
            calculateTotal();
        });
    });
    
    // Recalculate total when quantity changes
    document.querySelectorAll('.product-quantity, .job-quantity').forEach(input => {
        input.addEventListener('input', calculateTotal);
    });
    
    function calculateTotal() {
        let total = 0;
        
        // Calculate products total
        document.querySelectorAll('.product-checkbox:checked').forEach(checkbox => {
            const productId = checkbox.dataset.id;
            const price = parseFloat(checkbox.dataset.price);
            const quantity = parseInt(document.querySelector(`.product-quantity[data-id="${productId}"]`).value) || 1;
            total += price * quantity;
        });
        
        // Calculate jobs total
        document.querySelectorAll('.job-checkbox:checked').forEach(checkbox => {
            const jobId = checkbox.dataset.id;
            const price = parseFloat(checkbox.dataset.price);
            const quantity = parseInt(document.querySelector(`.job-quantity[data-id="${jobId}"]`).value) || 1;
            total += price * quantity;
        });
        
        document.getElementById('calculatedTotal').textContent = formatCurrency(total);
    }
    
    document.getElementById('orderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect selected products
        const orderProducts = [];
        document.querySelectorAll('.product-checkbox:checked').forEach(checkbox => {
            const productId = parseInt(checkbox.dataset.id);
            const quantity = parseInt(document.querySelector(`.product-quantity[data-id="${productId}"]`).value) || 1;
            orderProducts.push({ ProductId: productId, Quantity: quantity, Done: false });
        });
        
        // Collect selected jobs
        const orderJobs = [];
        document.querySelectorAll('.job-checkbox:checked').forEach(checkbox => {
            const jobId = parseInt(checkbox.dataset.id);
            const price = parseFloat(checkbox.dataset.price);
            orderJobs.push({ JobId: jobId, Price: price, Done: false });
        });
        
        if (orderProducts.length === 0 && orderJobs.length === 0) {
            showToast('Please select at least one product or job', 'error');
            return;
        }
        
        // Calculate total price
        let totalPrice = 0;
        document.querySelectorAll('.product-checkbox:checked, .job-checkbox:checked').forEach(checkbox => {
            const id = checkbox.dataset.id;
            const price = parseFloat(checkbox.dataset.price);
            const quantityInput = document.querySelector(`.product-quantity[data-id="${id}"], .job-quantity[data-id="${id}"]`);
            const quantity = parseInt(quantityInput.value) || 1;
            totalPrice += price * quantity;
        });
        
        const data = {
            UserId: parseInt(document.getElementById('usersId').value),
            ManagerId: parseInt(document.getElementById('managerId').value),
            Status: parseInt(document.getElementById('orderStatus').value),
            TotalPrice: totalPrice,
            OrderProducts: orderProducts,
            OrderJobs: orderJobs
        };
        
        try {
            await api.createOrder(data);
            showToast('Order created successfully!', 'success');
            closeModal();
            loadOrders();
            if (isAdmin(user.role)) {
                loadDashboardStats();
            }
        } catch (error) {
            showToast('Error creating order: ' + error.message, 'error');
        }
    });
}

function showAddDocumentForm() {
    const formHtml = `
        <form id="documentForm" class="modal-form">
            <div class="form-group">
                <label for="orderId">Order ID *</label>
                <input type="number" id="orderId" required>
            </div>
            <div class="form-group">
                <label for="docName">Document Name *</label>
                <input type="text" id="docName" required>
            </div>
            <div class="form-group">
                <label for="filePath">File Path *</label>
                <input type="text" id="filePath" placeholder="/documents/file.pdf" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Add Document</button>
        </form>
    `;
    
    openModal('Add New Document', formHtml);
    
    document.getElementById('documentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            OrderId: parseInt(document.getElementById('orderId').value),
            Name: document.getElementById('docName').value,
            FilePath: document.getElementById('filePath').value
        };
        
        try {
            await api.createDocument(data);
            showToast('Document added successfully!', 'success');
            closeModal();
            loadDocuments();
            loadDashboardStats();
        } catch (error) {
            showToast('Error adding document: ' + error.message, 'error');
        }
    });
}

function showAddCommentForm() {
    const user = getCurrentUser();
    const userId = 1; // You might want to get actual user ID
    
    const formHtml = `
        <form id="commentForm" class="modal-form">
            <div class="form-group">
                <label for="userId">User ID *</label>
                <input type="number" id="userId" value="${userId}" required>
            </div>
            <div class="form-group">
                <label>Comment Type *</label>
                <select id="commentType" required>
                    <option value="">Select type</option>
                    <option value="order">Order Comment</option>
                    <option value="document">Document Comment</option>
                </select>
            </div>
            <div class="form-group" id="orderIdGroup" style="display:none;">
                <label for="commentOrderId">Order ID</label>
                <input type="number" id="commentOrderId">
            </div>
            <div class="form-group" id="documentIdGroup" style="display:none;">
                <label for="commentDocumentId">Document ID</label>
                <input type="number" id="commentDocumentId">
            </div>
            <div class="form-group">
                <label for="commentText">Comment Text *</label>
                <textarea id="commentText" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Add Comment</button>
        </form>
    `;
    
    openModal('Add New Comment', formHtml);
    
    document.getElementById('commentType').addEventListener('change', (e) => {
        const orderGroup = document.getElementById('orderIdGroup');
        const documentGroup = document.getElementById('documentIdGroup');
        
        if (e.target.value === 'order') {
            orderGroup.style.display = 'block';
            documentGroup.style.display = 'none';
            document.getElementById('commentOrderId').required = true;
            document.getElementById('commentDocumentId').required = false;
        } else if (e.target.value === 'document') {
            orderGroup.style.display = 'none';
            documentGroup.style.display = 'block';
            document.getElementById('commentOrderId').required = false;
            document.getElementById('commentDocumentId').required = true;
        }
    });
    
    document.getElementById('commentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const type = document.getElementById('commentType').value;
        const data = {
            UserId: parseInt(document.getElementById('userId').value),
            Text: document.getElementById('commentText').value
        };
        
        if (type === 'order') {
            data.OrderId = parseInt(document.getElementById('commentOrderId').value);
            data.DocumentId = null;
        } else {
            data.OrderId = null;
            data.DocumentId = parseInt(document.getElementById('commentDocumentId').value);
        }
        
        try {
            await api.createComment(data);
            showToast('Comment added successfully!', 'success');
            closeModal();
            loadComments();
            loadDashboardStats();
        } catch (error) {
            showToast('Error adding comment: ' + error.message, 'error');
        }
    });
}

// View/Edit/Delete functions (simplified versions)
async function viewProduct(id) {
    try {
        const product = await api.getProduct(id);
        const content = `
            <div class="details-view">
                <p><strong>ID:</strong> ${product.Id || product.id}</p>
                <p><strong>Name:</strong> ${escapeHtml(product.Name || product.name)}</p>
                <p><strong>Description:</strong> ${escapeHtml(product.Description || product.description || 'N/A')}</p>
                <p><strong>Price:</strong> ${formatCurrency(product.Price || product.price)}</p>
                <p><strong>Type:</strong> ${product.Type || product.type}</p>
            </div>
        `;
        openModal('Product Details', content);
    } catch (error) {
        showToast('Error loading product: ' + error.message, 'error');
    }
}

function editProduct(id) {
    showToast('Edit functionality coming soon!', 'info');
}

async function deleteProductConfirm(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await api.deleteProduct(id);
            showToast('Product deleted successfully!', 'success');
            loadProducts();
            loadDashboardStats();
        } catch (error) {
            showToast('Error deleting product: ' + error.message, 'error');
        }
    }
}

// Similar view/edit/delete functions for orders, documents, comments
async function viewOrder(id) {
    try {
        const user = getCurrentUser();
        const order = await api.getOrder(id);
        
        // Get comments and documents for this order with user information
        let comments = [];
        let documents = [];
        let users = [];
        try {
            const [allComments, allDocuments] = await Promise.all([
                api.getComments(),
                api.getDocuments()
            ]);
            
            // Try to load users if admin/manager, otherwise use user info from comments
            try {
                users = await api.getUsers();
            } catch (err) {
                console.log('Cannot load all users (client mode), using comment user data');
                users = [];
            }
            
            // Get all comments for this order (both order comments and document comments)
            comments = allComments;
            documents = allDocuments.filter(d => (d.OrderId || d.orderId) == id);
        } catch (error) {
            console.error('Error loading comments/documents:', error);
        }
        
        // Get order products and jobs
        const orderProducts = order.OrderProducts || order.orderProducts || [];
        const orderJobs = order.OrderJobs || order.orderJobs || [];
        
        // Load all products, jobs, and managers to get names
        let allProducts = [];
        let allJobs = [];
        let managers = [];
        try {
            [allProducts, allJobs, managers] = await Promise.all([
                api.getProducts(),
                api.getJobs(),
                api.get('/api/manager')
            ]);
        } catch (err) {
            console.error('Error loading products/jobs/managers:', err);
        }
        
        // Get manager name
        let managerName = 'Not assigned';
        if (order.ManagerId || order.managerId) {
            const managerId = order.ManagerId || order.managerId;
            const manager = managers.find(m => (m.UserId || m.userId) === managerId);
            if (manager && manager.User) {
                managerName = manager.User.Username || manager.User.username || `Manager ${managerId}`;
            }
        }
        
        const content = `
            <div class="order-details-view">
                <div class="order-info-section">
                    <h3>Order Information</h3>
                    <p><strong>Manager:</strong> ${managerName}</p>
                    <p><strong>Status:</strong> <span class="badge">${getStatusText(order.Status || order.status)}</span></p>
                    <p><strong>Total Price:</strong> ${formatCurrency(order.TotalPrice ?? order.totalPrice ?? 0)}</p>
                </div>
                
                <div class="order-comments-section">
                    <h3>Order Comments</h3>
                    ${(() => {
                        // Filter to show only order-level comments (not document comments)
                        const orderComments = comments.filter(c => 
                            (c.OrderId || c.orderId) == id && !(c.DocumentId || c.documentId)
                        );
                        return orderComments.length > 0 ? `
                        <div class="comments-list">
                            ${orderComments.map(c => {
                                // Get user email from users array if not in comment object
                                let userEmail = c.User?.Email || c.User?.email;
                                if (!userEmail) {
                                    const userId = c.UserId || c.userId;
                                    const user = users.find(u => (u.Id || u.id) === userId);
                                    userEmail = user ? (user.Email || user.email) : 'Unknown User';
                                }
                                const commentId = c.Id || c.id;
                                return `
                                <div class="comment-item" style="display: flex; justify-content: space-between; align-items: start; padding: 10px; background: #f5f5f5; margin: 5px 0; border-radius: 5px;">
                                    <div>
                                        <p class="comment-text" style="margin: 0 0 5px 0;">${escapeHtml(c.Text || c.text)}</p>
                                        <small class="comment-meta">By: ${escapeHtml(userEmail)}</small>
                                    </div>
                                    <button class="btn btn-sm btn-danger" onclick="deleteOrderComment(${commentId}, ${id})" title="Delete comment">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    ` : '<p class="no-data">No order comments yet</p>';
                    })()}
                </div>
                
                <div class="order-items-section">
                    <h3>Products & Jobs</h3>
                    ${(orderProducts.length > 0 || orderJobs.length > 0) ? `
                        <table class="details-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orderProducts.map(op => {
                                    const product = allProducts.find(p => (p.Id || p.id) === (op.ProductId || op.productId));
                                    const productName = product ? (product.Name || product.name) : 'Unknown Product';
                                    const productImage = product ? (product.Image || product.image) : null;
                                    const productQuantity = product ? (product.quantity || product.quantity) : 0;
                                    const productPrice = product ? (product.Price || product.price) : 0;
                                   
                                    return `
                                    <tr>
                                        <td>${productImage ? `<img src="${escapeHtml(productImage)}" alt="${escapeHtml(productName)}" style="width: 50px; height: 50px; object-fit: cover;">` : '<span style="color: #999;">No image</span>'}</td>
                                        <td>${escapeHtml(productName)}</td>
                                        <td>Qty: ${op.Quantity || op.quantity}</td>
                                        <td>${formatCurrency(productPrice)}</td>
                                    </tr>
                                    `;
                                }).join('')}
                                ${orderJobs.map(oj => {
                                    const job = allJobs.find(j => (j.Id || j.id) === (oj.JobId || oj.jobId));
                                    const jobName = job ? (job.Name || job.name) : 'Unknown Job';
                                    const jobPrice = oj.Price || oj.price || 0;
                                    return `
                                    <tr>
                                        <td><span style="color: #999;">-</span></td>
                                        <td>${escapeHtml(jobName)}</td>
                                        <td>-</td>
                                        <td>${formatCurrency(jobPrice)}</td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    ` : '<p class="no-data">No products or jobs added yet</p>'}
                </div>
                
                <div class="order-documents-section">
                    <h3>Documents</h3>
                    ${documents.length > 0 ? `
                        <div class="documents-list">
                            ${documents.map(doc => {
                                const docId = doc.Id || doc.id;
                                const docName = doc.Name || doc.name || 'Untitled Document';
                                const docPath = doc.FilePath || doc.filePath || doc.Path || doc.path || '';
                                const docComments = comments.filter(c => (c.DocumentId || c.documentId) == docId);
                                
                                return `
                                <div class="document-item" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <h4 style="margin: 0;">
                                            <i class="fas fa-file-alt" style="color: #667eea; margin-right: 8px;"></i>
                                            ${escapeHtml(docName)}
                                        </h4>
                                        <div style="display: flex; gap: 10px;">
                                            ${docPath ? `
                                                <a href="${escapeHtml(docPath)}" target="_blank" class="btn btn-primary" style="text-decoration: none;">
                                                    <i class="fas fa-external-link-alt"></i> Open Document
                                                </a>
                                            ` : `
                                                <span style="color: #999; font-size: 14px;">
                                                    <i class="fas fa-info-circle"></i> No file path available
                                                </span>
                                            `}
                                            <button class="btn btn-danger" onclick="deleteOrderDocument(${docId}, ${id})" title="Delete document">
                                                <i class="fas fa-trash"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="document-comments" style="margin-top: 10px;">
                                        <strong>Comments on this document:</strong>
                                        ${docComments.length > 0 ? `
                                            <div style="margin-top: 10px;">
                                                ${docComments.map(c => {
                                                    let userEmail = c.User?.Email || c.User?.email;
                                                    if (!userEmail) {
                                                        const userId = c.UserId || c.userId;
                                                        const commentUser = users.find(u => (u.Id || u.id) === userId);
                                                        userEmail = commentUser ? (commentUser.Email || commentUser.email) : 'Unknown User';
                                                    }
                                                    const commentId = c.Id || c.id;
                                                    return `
                                                    <div style="background: #f5f5f5; padding: 10px; margin: 5px 0; border-radius: 3px; display: flex; justify-content: space-between; align-items: start;">
                                                        <div>
                                                            <p style="margin: 0 0 5px 0;">${escapeHtml(c.Text || c.text)}</p>
                                                            <small style="color: #666;">By: ${escapeHtml(userEmail)}</small>
                                                        </div>
                                                        <button class="btn btn-sm btn-danger" onclick="deleteOrderComment(${commentId}, ${id})" title="Delete comment">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                    `;
                                                }).join('')}
                                            </div>
                                        ` : '<p style="color: #999; font-size: 14px; margin: 5px 0;">No comments yet</p>'}
                                        
                                        <button class="btn btn-sm btn-secondary" onclick="addDocumentComment(${docId}, ${order.Id || order.id})" style="margin-top: 10px;">
                                            <i class="fas fa-comment"></i> Add Comment
                                        </button>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    ` : '<p class="no-data">No documents attached yet</p>'}
                </div>
                
                ${(isAdmin(user.role) || user.role === 'manager' || user.role === 'Manager' || user.role === 2 || user.role === '2') ? `
                    <div class="order-actions">
                        <button class="btn btn-primary" onclick="editOrderDetails(${order.Id || order.id})">
                            <i class="fas fa-edit"></i> Edit Order
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        openModal('Order Details', content);
    } catch (error) {
        showToast('Error loading order: ' + error.message, 'error');
    }
}

// Add comment to a document
async function addDocumentComment(documentId, orderId) {
    const user = getCurrentUser();
    
    if (!user || !user.id) {
        showToast('User not logged in', 'error');
        return;
    }
    
    const formHtml = `
        <form id="documentCommentForm" class="modal-form">
            <div class="form-group">
                <label for="commentText">Comment *</label>
                <textarea id="commentText" rows="4" required placeholder="Enter your comment..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Add Comment</button>
        </form>
    `;
    
    openModal('Add Comment to Document', formHtml);
    
    document.getElementById('documentCommentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const commentText = document.getElementById('commentText').value;
        
        if (!commentText.trim()) {
            showToast('Please enter a comment', 'error');
            return;
        }
        
        try {
            // Comment on document only - don't include OrderId
            const data = {
                DocumentId: parseInt(documentId),
                UserId: parseInt(user.id),
                Text: commentText
            };
            
            console.log('Creating comment with data:', data);
            
            await api.createComment(data);
            showToast('Comment added successfully!', 'success');
            closeModal();
            
            // Refresh the order view
            viewOrder(orderId);
        } catch (error) {
            console.error('Error adding comment:', error);
            showToast('Error adding comment: ' + error.message, 'error');
        }
    });
}

async function editOrderDetails(id) {
    try {
        const order = await api.getOrder(id);
        const allProducts = await api.getProducts();
        
        // Fetch all users and managers
        const users = await api.getUsers();
        const managers = await api.get('/api/manager');
        
        // Get user email
        const userId = order.UserId || order.userId;
        const user = users.find(u => (u.Id || u.id) === userId);
        const userEmail = user ? (user.Email || user.email) : 'Unknown';
        
        // Build manager options
        const managerOptions = managers.map(m => {
            // Use UserId (which references users.id), not manager table Id
            const managerUserId = m.UserId || m.userId;
            const managerUser = m.User || m.user;
            const managerName = managerUser ? (managerUser.Username || managerUser.username) : `Manager ${managerUserId}`;
            const selected = managerUserId === (order.ManagerId || order.managerId) ? 'selected' : '';
            return `<option value="${managerUserId}" ${selected}>${escapeHtml(managerName)}</option>`;
        }).join('');
        
        // Separate jobs from products
        const jobs = allProducts.filter(p => (p.Type || p.type) === 7);
        const products = allProducts.filter(p => (p.Type || p.type) !== 7);
        
        // Get existing order products
        const existingProducts = order.OrderProducts || order.orderProducts || [];
        
        const formHtml = `
            <form id="editOrderForm" class="modal-form order-form-extended">
                <input type="hidden" id="editUserId" value="${userId}">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editUserEmail">User Email *</label>
                        <input type="text" id="editUserEmail" value="${escapeHtml(userEmail)}" readonly style="background-color: #f5f5f5; cursor: not-allowed;">
                    </div>
                    <div class="form-group">
                        <label for="editManagerId">Manager *</label>
                        <select id="editManagerId" required>
                            <option value="">Select Manager</option>
                            ${managerOptions}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="editOrderStatus">Status *</label>
                    <select id="editOrderStatus" required>
                        <option value="1" ${(order.Status || order.status) == 1 ? 'selected' : ''}>Pending</option>
                        <option value="2" ${(order.Status || order.status) == 2 ? 'selected' : ''}>Processing</option>
                        <option value="3" ${(order.Status || order.status) == 3 ? 'selected' : ''}>Completed</option>
                        <option value="4" ${(order.Status || order.status) == 4 ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                
                <div class="order-tables-container">
                    <div class="order-table-section">
                        <h3>Select Products</h3>
                        <div class="order-table-wrapper">
                            <table class="order-selection-table">
                                <thead>
                                    <tr>
                                        <th>Select</th>
                                        <th>Name</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Done</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${products.map(p => {
                                        const existing = existingProducts.find(ep => (ep.ProductId || ep.productId) == (p.Id || p.id));
                                        const isChecked = !!existing;
                                        const quantity = existing ? (existing.Quantity || existing.quantity) : 1;
                                        const isDone = existing ? (existing.Done || existing.done || false) : false;
                                        return `
                                            <tr>
                                                <td>
                                                    <input type="checkbox" class="product-checkbox" data-id="${p.Id || p.id}" data-price="${p.Price || p.price}" ${isChecked ? 'checked' : ''}>
                                                </td>
                                                <td>${escapeHtml(p.Name || p.name)}</td>
                                                <td>${formatCurrency(p.Price || p.price)}</td>
                                                <td>
                                                    <input type="number" class="product-quantity" data-id="${p.Id || p.id}" min="1" value="${quantity}" ${!isChecked ? 'disabled' : ''}>
                                                </td>
                                                <td>
                                                    <input type="checkbox" class="product-done" data-id="${p.Id || p.id}" ${isDone ? 'checked' : ''} ${!isChecked ? 'disabled' : ''}>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="order-table-section">
                        <h3>Select Jobs</h3>
                        <div class="order-table-wrapper">
                            <table class="order-selection-table">
                                <thead>
                                    <tr>
                                        <th>Select</th>
                                        <th>Name</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Done</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${jobs.map(j => {
                                        const existing = existingProducts.find(ep => (ep.ProductId || ep.productId) == (j.Id || j.id));
                                        const isChecked = !!existing;
                                        const quantity = existing ? (existing.Quantity || existing.quantity) : 1;
                                        const isDone = existing ? (existing.Done || existing.done || false) : false;
                                        return `
                                            <tr>
                                                <td>
                                                    <input type="checkbox" class="job-checkbox" data-id="${j.Id || j.id}" data-price="${j.Price || j.price}" ${isChecked ? 'checked' : ''}>
                                                </td>
                                                <td>${escapeHtml(j.Name || j.name)}</td>
                                                <td>${formatCurrency(j.Price || j.price)}</td>
                                                <td>
                                                    <input type="number" class="job-quantity" data-id="${j.Id || j.id}" min="1" value="${quantity}" ${!isChecked ? 'disabled' : ''}>
                                                </td>
                                                <td>
                                                    <input type="checkbox" class="job-done" data-id="${j.Id || j.id}" ${isDone ? 'checked' : ''} ${!isChecked ? 'disabled' : ''}>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Total Price: <span id="editCalculatedTotal">€0.00</span></label>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">Update Order</button>
            </form>
        `;
        
        openModal('Edit Order', formHtml);
        
        // Enable/disable inputs based on checkbox
        document.querySelectorAll('.product-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const productId = e.target.dataset.id;
                const quantityInput = document.querySelector(`.product-quantity[data-id="${productId}"]`);
                const doneInput = document.querySelector(`.product-done[data-id="${productId}"]`);
                quantityInput.disabled = !e.target.checked;
                doneInput.disabled = !e.target.checked;
                if (!e.target.checked) {
                    quantityInput.value = 1;
                    doneInput.checked = false;
                }
                calculateEditTotal();
            });
        });
        
        document.querySelectorAll('.job-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const jobId = e.target.dataset.id;
                const quantityInput = document.querySelector(`.job-quantity[data-id="${jobId}"]`);
                const doneInput = document.querySelector(`.job-done[data-id="${jobId}"]`);
                quantityInput.disabled = !e.target.checked;
                doneInput.disabled = !e.target.checked;
                if (!e.target.checked) {
                    quantityInput.value = 1;
                    doneInput.checked = false;
                }
                calculateEditTotal();
            });
        });
        
        document.querySelectorAll('.product-quantity, .job-quantity').forEach(input => {
            input.addEventListener('input', calculateEditTotal);
        });
        
        function calculateEditTotal() {
            let total = 0;
            document.querySelectorAll('.product-checkbox:checked').forEach(checkbox => {
                const productId = checkbox.dataset.id;
                const price = parseFloat(checkbox.dataset.price);
                const quantity = parseInt(document.querySelector(`.product-quantity[data-id="${productId}"]`).value) || 1;
                total += price * quantity;
            });
            document.querySelectorAll('.job-checkbox:checked').forEach(checkbox => {
                const jobId = checkbox.dataset.id;
                const price = parseFloat(checkbox.dataset.price);
                const quantity = parseInt(document.querySelector(`.job-quantity[data-id="${jobId}"]`).value) || 1;
                total += price * quantity;
            });
            document.getElementById('editCalculatedTotal').textContent = formatCurrency(total);
        }
        
        calculateEditTotal(); // Initial calculation
        
        document.getElementById('editOrderForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const orderProducts = [];
            document.querySelectorAll('.product-checkbox:checked').forEach(checkbox => {
                const productId = parseInt(checkbox.dataset.id);
                const quantity = parseInt(document.querySelector(`.product-quantity[data-id="${productId}"]`).value) || 1;
                const done = document.querySelector(`.product-done[data-id="${productId}"]`).checked;
                orderProducts.push({ ProductId: productId, Quantity: quantity, Done: done });
            });
            
            document.querySelectorAll('.job-checkbox:checked').forEach(checkbox => {
                const jobId = parseInt(checkbox.dataset.id);
                const quantity = parseInt(document.querySelector(`.job-quantity[data-id="${jobId}"]`).value) || 1;
                const done = document.querySelector(`.job-done[data-id="${jobId}"]`).checked;
                orderProducts.push({ ProductId: jobId, Quantity: quantity, Done: done });
            });
            
            let totalPrice = 0;
            document.querySelectorAll('.product-checkbox:checked, .job-checkbox:checked').forEach(checkbox => {
                const itemId = checkbox.dataset.id;
                const price = parseFloat(checkbox.dataset.price);
                const quantityInput = document.querySelector(`.product-quantity[data-id="${itemId}"], .job-quantity[data-id="${itemId}"]`);
                const quantity = parseInt(quantityInput.value) || 1;
                totalPrice += price * quantity;
            });
            
            const data = {
                UserId: parseInt(document.getElementById('editUserId').value),
                ManagerId: parseInt(document.getElementById('editManagerId').value),
                Status: parseInt(document.getElementById('editOrderStatus').value),
                TotalPrice: totalPrice,
                OrderProducts: orderProducts
            };
            
            try {
                await api.updateOrder(id, data);
                showToast('Order updated successfully!', 'success');
                closeModal();
                loadOrders();
            } catch (error) {
                showToast('Error updating order: ' + error.message, 'error');
            }
        });
    } catch (error) {
        showToast('Error loading order for editing: ' + error.message, 'error');
    }
}

function editOrder(id) { editOrderDetails(id); }

// Redirect to orders.html page for editing
function editOrderPage(id) {
    window.location.href = `orders.html?id=${id}`;
}

async function deleteOrderConfirm(id) {
    if (confirm('Are you sure you want to delete this order?')) {
        try {
            await api.deleteOrder(id);
            showToast('Order deleted successfully!', 'success');
            loadOrders();
            loadDashboardStats();
        } catch (error) {
            showToast('Error deleting order: ' + error.message, 'error');
        }
    }
}

async function viewDocument(id) {
    try {
        const doc = await api.getDocument(id);
        const content = `
            <div class="details-view">
                <p><strong>ID:</strong> ${doc.Id || doc.id}</p>
                <p><strong>Order ID:</strong> ${doc.OrderId || doc.orderId}</p>
                <p><strong>Name:</strong> ${escapeHtml(doc.Name || doc.name)}</p>
                <p><strong>File Path:</strong> ${escapeHtml(doc.FilePath || doc.filePath)}</p>
                <p><strong>Created:</strong> ${formatDate(doc.CreatedAt || doc.createdAt)}</p>
            </div>
        `;
        openModal('Document Details', content);
    } catch (error) {
        showToast('Error loading document: ' + error.message, 'error');
    }
}

function editDocument(id) { showToast('Edit functionality coming soon!', 'info'); }
async function deleteDocumentConfirm(id) {
    if (confirm('Are you sure you want to delete this document?')) {
        try {
            await api.deleteDocument(id);
            showToast('Document deleted successfully!', 'success');
            loadDocuments();
            loadDashboardStats();
        } catch (error) {
            showToast('Error deleting document: ' + error.message, 'error');
        }
    }
}

async function viewComment(id) {
    try {
        const comment = await api.getComment(id);
        const content = `
            <div class="details-view">
                <p><strong>ID:</strong> ${comment.Id || comment.id}</p>
                <p><strong>User ID:</strong> ${comment.UserId || comment.userId}</p>
                <p><strong>Order ID:</strong> ${comment.OrderId || comment.orderId || 'N/A'}</p>
                <p><strong>Document ID:</strong> ${comment.DocumentId || comment.documentId || 'N/A'}</p>
                <p><strong>Text:</strong> ${escapeHtml(comment.Text || comment.text)}</p>
            </div>
        `;
        openModal('Comment Details', content);
    } catch (error) {
        showToast('Error loading comment: ' + error.message, 'error');
    }
}

function editComment(id) { showToast('Edit functionality coming soon!', 'info'); }
async function deleteCommentConfirm(id) {
    if (confirm('Are you sure you want to delete this comment?')) {
        try {
            await api.deleteComment(id);
            showToast('Comment deleted successfully!', 'success');
            loadComments();
            loadDashboardStats();
        } catch (error) {
            showToast('Error deleting comment: ' + error.message, 'error');
        }
    }
}

// Order Action Functions
function addCommentToOrder(orderId) {
    const user = getCurrentUser();
    const userId = user && user.id ? user.id : 1;
    
    const formHtml = `
        <form id="commentForm" class="modal-form">
            <input type="hidden" id="commentOrderId" value="${orderId}">
            <div class="form-group">
                <label for="commentText">Comment Text *</label>
                <textarea id="commentText" rows="6" required placeholder="Enter your comment about this order..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Add Comment</button>
        </form>
    `;
    
    openModal('Add Comment to Order #' + orderId, formHtml);
    
    document.getElementById('commentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            UserId: userId,
            OrderId: orderId,
            Text: document.getElementById('commentText').value
        };
        
        try {
            await api.createComment(data);
            showToast('Comment added successfully!', 'success');
            closeModal();
        } catch (error) {
            showToast('Error adding comment: ' + error.message, 'error');
        }
    });
}

function addDocumentToOrder(orderId) {
    const formHtml = `
        <form id="documentForm" class="modal-form">
            <input type="hidden" id="orderId" value="${orderId}">
            <div class="form-group">
                <label for="docName">Document Name *</label>
                <input type="text" id="docName" required placeholder="e.g., Invoice, Receipt">
            </div>
            <div class="form-group">
                <label for="filePath">File Path *</label>
                <input type="text" id="filePath" placeholder="/documents/file.pdf" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Add Document</button>
        </form>
    `;
    
    openModal('Add Document to Order #' + orderId, formHtml);
    
    document.getElementById('documentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            OrderId: orderId,
            Name: document.getElementById('docName').value,
            FilePath: document.getElementById('filePath').value
        };
        
        try {
            await api.createDocument(data);
            showToast('Document added successfully!', 'success');
            closeModal();
        } catch (error) {
            showToast('Error adding document: ' + error.message, 'error');
        }
    });
}

// Users Management
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
        const users = await api.getUsers();
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px;">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => {
            const userId = user.Id || user.id;
            const username = user.Username || user.username;
            const email = user.Email || user.email;
            const role = user.Role || user.role;
            const roleText = getRoleText(role);
            const createdAt = formatDate(user.CreatedAt || user.createdAt);
            
            return `
            <tr>
                <td>${escapeHtml(username)}</td>
                <td>${escapeHtml(email)}</td>
                <td><span class="badge">${roleText}</span></td>
                <td>${createdAt}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="changeUserRole(${userId}, '${escapeHtml(username)}')" title="Change Role">
                        <i class="fas fa-user-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUserConfirm(${userId}, '${escapeHtml(username)}')" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--danger-color);">Error loading users</td></tr>';
        showToast('Error loading users: ' + error.message, 'error');
    }
}

function getRoleText(role) {
    const roleMap = {
        1: 'Admin',
        2: 'Manager',
        3: 'Client',
        'admin': 'Admin',
        'manager': 'Manager',
        'client': 'Client'
    };
    return roleMap[role] || 'Unknown';
}

async function changeUserRole(userId, username) {
    const formHtml = `
        <form id="changeRoleForm" class="modal-form">
            <p>Change role for user: <strong>${username}</strong></p>
            <div class="form-group">
                <label for="newRole">New Role *</label>
                <select id="newRole" required>
                    <option value="">Select role</option>
                    <option value="1">Admin</option>
                    <option value="2">Manager</option>
                    <option value="3">Client</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Change Role</button>
        </form>
    `;
    
    openModal('Change User Role', formHtml);
    
    document.getElementById('changeRoleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newRole = parseInt(document.getElementById('newRole').value);
        
        try {
            await api.put(`/api/users/${userId}/role`, { role: newRole });
            showToast('User role updated successfully!', 'success');
            closeModal();
            loadUsers();
        } catch (error) {
            showToast('Error updating user role: ' + error.message, 'error');
        }
    });
}

function deleteUserConfirm(userId, username) {
    if (confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        deleteUser(userId);
    }
}

async function deleteUser(userId) {
    try {
        await api.delete(`/api/users/${userId}`);
        showToast('User deleted successfully!', 'success');
        loadUsers();
    } catch (error) {
        showToast('Error deleting user: ' + error.message, 'error');
    }
}

// Add document row to client order form
function addDocumentRow() {
    const container = document.getElementById('documentsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'document-input-row';
    newRow.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
    newRow.innerHTML = `
        <input type="text" class="doc-name" placeholder="Document name" style="flex: 1;">
        <input type="text" class="doc-path" placeholder="File path or URL" style="flex: 2;">
        <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(newRow);
}

// Delete comment from order view
async function deleteOrderComment(commentId, orderId) {
    if (confirm('Are you sure you want to delete this comment?')) {
        try {
            await api.deleteComment(commentId);
            showToast('Comment deleted successfully!', 'success');
            // Refresh the order view
            viewOrder(orderId);
        } catch (error) {
            showToast('Error deleting comment: ' + error.message, 'error');
        }
    }
}

// Delete document from order view
async function deleteOrderDocument(documentId, orderId) {
    if (confirm('Are you sure you want to delete this document?')) {
        try {
            await api.deleteDocument(documentId);
            showToast('Document deleted successfully!', 'success');
            // Refresh the order view
            viewOrder(orderId);
        } catch (error) {
            showToast('Error deleting document: ' + error.message, 'error');
        }
    }
}

// Utility Functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return (text || '').replace(/[&<>"']/g, m => map[m]);
}
