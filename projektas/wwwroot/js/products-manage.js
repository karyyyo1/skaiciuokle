// API instance is already created in api.js

// State management
let allProducts = [];
let filteredProducts = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadProducts();
    setupModal();
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
        showToast('Access denied. Admin role required.', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return false;
    }
    
    const userIsAdmin = isAdmin(user.role);
    
    console.log('Role value:', user.role, 'Type:', typeof user.role);
    console.log('Is admin:', userIsAdmin);
    
    if (!userIsAdmin) {
        console.log('User is not admin, redirecting to index');
        showToast('Access denied. Admin role required.', 'error');
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

// Load all products and jobs
async function loadProducts() {
    try {
        console.log('Loading products and jobs...');
        const [products, jobs] = await Promise.all([
            api.getProducts(),
            api.getJobs()
        ]);
        
        // Add Type property to jobs for consistency
        const jobsWithType = jobs.map(job => ({
            ...job,
            Type: 7,
            type: 7
        }));
        
        // Combine products and jobs
        allProducts = [...products, ...jobsWithType];
        console.log('Products loaded:', products.length, 'Jobs loaded:', jobs.length);
        
        filteredProducts = [...allProducts];
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsGrid').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading products: ${error.message}</p>
            </div>
        `;
        showToast('Error loading products: ' + error.message, 'error');
    }
}

// Render products grid
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>No products found</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredProducts.map(product => {
        const id = product.Id || product.id;
        const name = product.Name || product.name;
        const price = product.Price || product.price;
        const description = product.Description || product.description || 'No description';
        const quantity = product.Quantity || product.quantity || 0;
        const type = (product.Type || product.type) === 7 ? 'job' : 'product';
        
        // Additional fields
        const color = product.Color || product.color || 'N/A';
        const connection = product.Connection || product.connection || 'N/A';
        const relays = product.Relays || product.relays || 'N/A';
        
        return `
            <div class="product-card">
                <span class="product-type ${type}">${type}</span>
                <h3>${escapeHtml(name)}</h3>
                <div class="price">${formatCurrency(price)}</div>
                <div class="description">${escapeHtml(description)}</div>
                
                <div class="details">
                    <div class="detail-item">
                        <strong>Quantity</strong>
                        ${quantity}
                    </div>
                    <div class="detail-item">
                        <strong>Color</strong>
                        ${escapeHtml(color)}
                    </div>
                    <div class="detail-item">
                        <strong>Connection</strong>
                        ${escapeHtml(connection)}
                    </div>
                    <div class="detail-item">
                        <strong>Relays</strong>
                        ${escapeHtml(relays)}
                    </div>
                </div>
                
                <div class="actions">
                    <button class="btn btn-sm btn-warning" onclick="editProduct(${id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProductConfirm(${id}, '${escapeHtml(name)}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Filter products
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    
    filteredProducts = allProducts.filter(product => {
        const name = (product.Name || product.name || '').toLowerCase();
        const description = (product.Description || product.description || '').toLowerCase();
        const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm);
        
        const productType = (product.Type || product.type) === 7 ? 'job' : 'product';
        const matchesType = !typeFilter || productType === typeFilter;
        
        return matchesSearch && matchesType;
    });
    
    renderProducts();
}

// Reset filters
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    filteredProducts = [...allProducts];
    renderProducts();
}

// Update form fields based on product type
function updateProductFormFields() {
    const typeSelect = document.getElementById('productType');
    const commonFields = document.getElementById('commonFields');
    const typeSpecificFields = document.getElementById('typeSpecificFields');
    
    const type = parseInt(typeSelect.value);
    
    if (!type) {
        commonFields.style.display = 'none';
        return;
    }
    
    commonFields.style.display = 'block';
    
    // Clear previous type-specific fields
    typeSpecificFields.innerHTML = '';
    
    // Add type-specific fields based on selection
    switch(type) {
        case 1: // Access Control
            typeSpecificFields.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label for="productConnection">Connection</label>
                        <input type="text" id="productConnection">
                    </div>
                    <div class="form-group">
                        <label for="productRelays">Relays</label>
                        <input type="text" id="productRelays">
                    </div>
                </div>
            `;
            break;
            
        case 2: // Gate Engine
            typeSpecificFields.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label for="productGateType">Gate Type</label>
                        <select id="productGateType">
                            <option value="">-- Select --</option>
                            <option value="1">Push</option>
                            <option value="2">Two Gates</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="productFast">Fast</label>
                        <select id="productFast">
                            <option value="">-- Select --</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                </div>
            `;
            break;
            
        case 3: // Poles
            typeSpecificFields.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label for="productWidth">Width</label>
                        <input type="number" id="productWidth" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="productLength">Length</label>
                        <input type="number" id="productLength" step="0.01">
                    </div>
                </div>
                <div class="form-group">
                    <label for="productHeight">Height</label>
                    <input type="number" id="productHeight" step="0.01">
                </div>
            `;
            break;
            
        case 4: // Fence
            typeSpecificFields.innerHTML = `
                <div class="form-group">
                    <label for="productFillType">Fill Type</label>
                    <select id="productFillType">
                        <option value="">-- Select --</option>
                        <option value="1">Sukos</option>
                        <option value="2">Segmentas</option>
                        <option value="3">Polisadas</option>
                        <option value="4">Skarda</option>
                    </select>
                </div>
            `;
            break;
            
        case 5: // Gate
            typeSpecificFields.innerHTML = `
                <div class="form-group">
                    <label for="productGateType">Gate Type</label>
                    <select id="productGateType">
                        <option value="">-- Select --</option>
                        <option value="1">Push</option>
                        <option value="2">Two Gates</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productWidth">Width</label>
                        <input type="number" id="productWidth" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="productHeight">Height</label>
                        <input type="number" id="productHeight" step="0.01">
                    </div>
                </div>
            `;
            break;
            
        case 6: // Gadgets
            typeSpecificFields.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label for="productConnection">Connection</label>
                        <input type="text" id="productConnection">
                    </div>
                    <div class="form-group">
                        <label for="productRelays">Relays</label>
                        <input type="text" id="productRelays">
                    </div>
                </div>
            `;
            break;
            
        case 7: // Jobs
            // No additional fields for jobs
            break;
    }
}

// Add new product
function addNewProduct() {
    const formHtml = `
        <form id="productForm" class="modal-form">
            <div class="form-group">
                <label for="productType">Product Type *</label>
                <select id="productType" required onchange="updateProductFormFields()">
                    <option value="">-- Select Type --</option>
                    <option value="1">Access Control</option>
                    <option value="2">Gate Engine</option>
                    <option value="3">Poles</option>
                    <option value="4">Fence</option>
                    <option value="5">Gate</option>
                    <option value="6">Gadgets</option>
                    <option value="7">Jobs</option>
                </select>
            </div>
            
            <div id="commonFields" style="display: none;">
                <div class="form-group">
                    <label for="productName">Product Name *</label>
                    <input type="text" id="productName" required>
                </div>
                <div class="form-group">
                    <label for="productDescription">Description</label>
                    <textarea id="productDescription" rows="3"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productPrice">Price *</label>
                        <input type="number" id="productPrice" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="productQuantity">Quantity *</label>
                        <input type="number" id="productQuantity" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="productImage">Image URL</label>
                    <input type="text" id="productImage" placeholder="https://example.com/image.jpg">
                </div>
                <div class="form-group">
                    <label for="productColor">Color</label>
                    <input type="text" id="productColor">
                </div>
                
                <!-- Type-specific fields -->
                <div id="typeSpecificFields"></div>
                
                <button type="submit" class="btn btn-primary btn-block">Create Product</button>
            </div>
        </form>
    `;
    
    openModal('Add New Product', formHtml);
    
    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            Name: document.getElementById('productName').value,
            Description: document.getElementById('productDescription').value,
            Price: parseFloat(document.getElementById('productPrice').value),
            Quantity: parseInt(document.getElementById('productQuantity').value),
            Type: parseInt(document.getElementById('productType').value),
            Image: document.getElementById('productImage').value || null,
            Color: document.getElementById('productColor').value || null
        };
        
        // Add type-specific fields if they exist
        const connectionField = document.getElementById('productConnection');
        if (connectionField) data.Connection = connectionField.value || null;
        
        const relaysField = document.getElementById('productRelays');
        if (relaysField) data.Relays = relaysField.value || null;
        
        const widthField = document.getElementById('productWidth');
        if (widthField) data.Width = parseFloat(widthField.value) || null;
        
        const lengthField = document.getElementById('productLength');
        if (lengthField) data.Length = parseFloat(lengthField.value) || null;
        
        const heightField = document.getElementById('productHeight');
        if (heightField) data.Height = parseFloat(heightField.value) || null;
        
        const gateTypeField = document.getElementById('productGateType');
        if (gateTypeField && gateTypeField.value) data.GateType = parseInt(gateTypeField.value);
        
        const fastField = document.getElementById('productFast');
        if (fastField && fastField.value) data.Fast = fastField.value === 'true';
        
        const fillTypeField = document.getElementById('productFillType');
        if (fillTypeField && fillTypeField.value) data.FillType = parseInt(fillTypeField.value);
        
        try {
            // Route to correct API based on type
            if (data.Type === 7) {
                // Create as Job
                const jobData = {
                    Name: data.Name,
                    Description: data.Description,
                    Price: data.Price
                };
                await api.createJob(jobData);
                showToast('Job created successfully!', 'success');
            } else {
                // Create as Product
                await api.createProduct(data);
                showToast('Product created successfully!', 'success');
            }
            closeModal();
            await loadProducts();
        } catch (error) {
            showToast('Error creating: ' + error.message, 'error');
        }
    });
}

// Update edit form fields based on type selection
function updateEditFormFields() {
    const typeSelect = document.getElementById('editProductType');
    const type = parseInt(typeSelect.value);
    
    // Show/hide quantity, image, color based on type
    const quantityGroup = document.getElementById('editQuantityGroup');
    const imageGroup = document.getElementById('editImageGroup');
    const colorGroup = document.getElementById('editColorGroup');
    
    if (type === 7) {
        // Jobs don't need quantity, image, color
        if (quantityGroup) quantityGroup.style.display = 'none';
        if (imageGroup) imageGroup.style.display = 'none';
        if (colorGroup) colorGroup.style.display = 'none';
    } else {
        if (quantityGroup) quantityGroup.style.display = 'block';
        if (imageGroup) imageGroup.style.display = 'block';
        if (colorGroup) colorGroup.style.display = 'block';
    }
    
    // Update type-specific fields
    const typeSpecificFields = document.getElementById('editTypeSpecificFields');
    typeSpecificFields.innerHTML = '';
    
    switch(type) {
        case 1: // Access Control
            typeSpecificFields.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label for="editProductConnection">Connection</label>
                        <input type="text" id="editProductConnection">
                    </div>
                    <div class="form-group">
                        <label for="editProductRelays">Relays</label>
                        <input type="text" id="editProductRelays">
                    </div>
                </div>
            `;
            break;
            
        case 2: // Gate Engine
            typeSpecificFields.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label for="editProductGateType">Gate Type</label>
                        <select id="editProductGateType">
                            <option value="">-- Select --</option>
                            <option value="1">Push</option>
                            <option value="2">Two Gates</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editProductFast">Fast</label>
                        <select id="editProductFast">
                            <option value="">-- Select --</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                </div>
            `;
            break;
            
        case 3: // Poles
            typeSpecificFields.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label for="editProductWidth">Width</label>
                        <input type="number" id="editProductWidth" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="editProductLength">Length</label>
                        <input type="number" id="editProductLength" step="0.01">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editProductHeight">Height</label>
                    <input type="number" id="editProductHeight" step="0.01">
                </div>
            `;
            break;
            
        case 4: // Fence
            typeSpecificFields.innerHTML = `
                <div class="form-group">
                    <label for="editProductFillType">Fill Type</label>
                    <select id="editProductFillType">
                        <option value="">-- Select --</option>
                        <option value="1">Sukos</option>
                        <option value="2">Segmentas</option>
                        <option value="3">Polisadas</option>
                        <option value="4">Skarda</option>
                    </select>
                </div>
            `;
            break;
            
        case 5: // Gate
            typeSpecificFields.innerHTML = `
                <div class="form-group">
                    <label for="editProductGateType">Gate Type</label>
                    <select id="editProductGateType">
                        <option value="">-- Select --</option>
                        <option value="1">Push</option>
                        <option value="2">Two Gates</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editProductWidth">Width</label>
                        <input type="number" id="editProductWidth" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="editProductHeight">Height</label>
                        <input type="number" id="editProductHeight" step="0.01">
                    </div>
                </div>
            `;
            break;
            
        case 6: // Gadgets
            typeSpecificFields.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label for="editProductConnection">Connection</label>
                        <input type="text" id="editProductConnection">
                    </div>
                    <div class="form-group">
                        <label for="editProductRelays">Relays</label>
                        <input type="text" id="editProductRelays">
                    </div>
                </div>
            `;
            break;
            
        case 7: // Jobs
            // No additional fields for jobs
            break;
    }
}

// Populate edit form with existing product data
function populateEditTypeSpecificFields(product, type) {
    updateEditFormFields();
    
    // Populate type-specific fields with existing values
    switch(type) {
        case 1: // Access Control
        case 6: // Gadgets
            const connectionField = document.getElementById('editProductConnection');
            if (connectionField) connectionField.value = product.Connection || product.connection || '';
            const relaysField = document.getElementById('editProductRelays');
            if (relaysField) relaysField.value = product.Relays || product.relays || '';
            break;
            
        case 2: // Gate Engine
            const gateTypeEngineField = document.getElementById('editProductGateType');
            if (gateTypeEngineField) gateTypeEngineField.value = product.GateType || product.gateType || '';
            const fastField = document.getElementById('editProductFast');
            if (fastField) fastField.value = (product.Fast || product.fast) === true ? 'true' : (product.Fast || product.fast) === false ? 'false' : '';
            break;
            
        case 3: // Poles
            const widthPoleField = document.getElementById('editProductWidth');
            if (widthPoleField) widthPoleField.value = product.Width || product.width || '';
            const lengthField = document.getElementById('editProductLength');
            if (lengthField) lengthField.value = product.Length || product.length || '';
            const heightPoleField = document.getElementById('editProductHeight');
            if (heightPoleField) heightPoleField.value = product.Height || product.height || '';
            break;
            
        case 4: // Fence
            const fillTypeField = document.getElementById('editProductFillType');
            if (fillTypeField) fillTypeField.value = product.FillType || product.fillType || '';
            break;
            
        case 5: // Gate
            const gateTypeField = document.getElementById('editProductGateType');
            if (gateTypeField) gateTypeField.value = product.GateType || product.gateType || '';
            const widthGateField = document.getElementById('editProductWidth');
            if (widthGateField) widthGateField.value = product.Width || product.width || '';
            const heightGateField = document.getElementById('editProductHeight');
            if (heightGateField) heightGateField.value = product.Height || product.height || '';
            break;
    }
}

// Edit product or job
async function editProduct(id) {
    try {
        // Try to find in allProducts to determine if it's a job or product
        const item = allProducts.find(p => (p.Id || p.id) === id);
        const isJob = item && (item.Type === 7 || item.type === 7);
        
        // Fetch from appropriate API
        const product = isJob ? await api.getJob(id) : await api.getProduct(id);
        const productType = product.Type || product.type || 1;
        
        const formHtml = `
            <form id="editProductForm" class="modal-form">
                <div class="form-group">
                    <label for="editProductType">Product Type *</label>
                    <select id="editProductType" required onchange="updateEditFormFields()">
                        <option value="1" ${productType === 1 ? 'selected' : ''}>Access Control</option>
                        <option value="2" ${productType === 2 ? 'selected' : ''}>Gate Engine</option>
                        <option value="3" ${productType === 3 ? 'selected' : ''}>Poles</option>
                        <option value="4" ${productType === 4 ? 'selected' : ''}>Fence</option>
                        <option value="5" ${productType === 5 ? 'selected' : ''}>Gate</option>
                        <option value="6" ${productType === 6 ? 'selected' : ''}>Gadgets</option>
                        <option value="7" ${productType === 7 ? 'selected' : ''}>Jobs</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="editProductName">Product Name *</label>
                    <input type="text" id="editProductName" value="${escapeHtml(product.Name || product.name)}" required>
                </div>
                <div class="form-group">
                    <label for="editProductDescription">Description</label>
                    <textarea id="editProductDescription" rows="3">${escapeHtml(product.Description || product.description || '')}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editProductPrice">Price *</label>
                        <input type="number" id="editProductPrice" step="0.01" value="${product.Price || product.price}" required>
                    </div>
                    <div class="form-group" id="editQuantityGroup">
                        <label for="editProductQuantity">Quantity *</label>
                        <input type="number" id="editProductQuantity" value="${product.Quantity || product.quantity || 0}">
                    </div>
                </div>
                <div class="form-group" id="editImageGroup">
                    <label for="editProductImage">Image URL</label>
                    <input type="text" id="editProductImage" value="${escapeHtml(product.Image || product.image || '')}" placeholder="https://example.com/image.jpg">
                </div>
                <div class="form-group" id="editColorGroup">
                    <label for="editProductColor">Color</label>
                    <input type="text" id="editProductColor" value="${escapeHtml(product.Color || product.color || '')}">
                </div>
                
                <!-- Type-specific fields -->
                <div id="editTypeSpecificFields"></div>
                
                <button type="submit" class="btn btn-primary btn-block">Update Product</button>
            </form>
        `;
        
        openModal('Edit Product', formHtml);
        
        // Populate type-specific fields based on current product type
        populateEditTypeSpecificFields(product, productType);
        
        document.getElementById('editProductForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                Name: document.getElementById('editProductName').value,
                Description: document.getElementById('editProductDescription').value,
                Price: parseFloat(document.getElementById('editProductPrice').value),
                Quantity: parseInt(document.getElementById('editProductQuantity').value),
                Type: parseInt(document.getElementById('editProductType').value),
                Image: document.getElementById('editProductImage').value || null,
                Color: document.getElementById('editProductColor').value || null,
                Connection: document.getElementById('editProductConnection').value || null,
                Relays: document.getElementById('editProductRelays').value || null,
                Width: parseFloat(document.getElementById('editProductWidth').value) || null,
                Length: parseFloat(document.getElementById('editProductLength').value) || null,
                Height: parseFloat(document.getElementById('editProductHeight').value) || null
            };
            
            // Add type-specific fields
            const gateTypeField = document.getElementById('editProductGateType');
            if (gateTypeField && gateTypeField.value) data.GateType = parseInt(gateTypeField.value);
            
            const fillTypeField = document.getElementById('editProductFillType');
            if (fillTypeField && fillTypeField.value) data.FillType = parseInt(fillTypeField.value);
            
            const fastField = document.getElementById('editProductFast');
            if (fastField && fastField.value) data.Fast = fastField.value === 'true';
            
            try {
                // Route to correct API based on whether it's a job or product
                if (isJob) {
                    // Update as Job (only Name, Description, Price)
                    const jobData = {
                        Name: data.Name,
                        Description: data.Description,
                        Price: data.Price
                    };
                    await api.updateJob(id, jobData);
                    showToast('Job updated successfully!', 'success');
                } else {
                    // Update as Product
                    await api.updateProduct(id, data);
                    showToast('Product updated successfully!', 'success');
                }
                closeModal();
                await loadProducts();
            } catch (error) {
                showToast('Error updating: ' + error.message, 'error');
            }
        });
    } catch (error) {
        showToast('Error loading product: ' + error.message, 'error');
    }
}

// Delete product confirmation
function deleteProductConfirm(id, name) {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
        deleteProduct(id);
    }
}

// Delete product or job
async function deleteProduct(id) {
    try {
        // Determine if it's a job or product
        const item = allProducts.find(p => (p.Id || p.id) === id);
        const isJob = item && (item.Type === 7 || item.type === 7);
        
        // Route to correct API
        if (isJob) {
            await api.deleteJob(id);
            showToast('Job deleted successfully!', 'success');
        } else {
            await api.deleteProduct(id);
            showToast('Product deleted successfully!', 'success');
        }
        await loadProducts();
    } catch (error) {
        showToast('Error deleting: ' + error.message, 'error');
    }
}

// Modal functions
function setupModal() {
    const modal = document.getElementById('modal');
    const modalClose = document.getElementById('modalClose');
    
    modalClose.addEventListener('click', closeModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function openModal(title, content) {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
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
