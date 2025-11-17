// UTA Lost & Found - Dashboard JavaScript
class Dashboard {
    constructor() {
        this.items = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.categoryFilter = '';
        this.typeFilter = '';
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.waitForAuth();
        await this.loadItemsFromFirebase();
        this.updateStats();
        this.renderItems();
    }
    
    async waitForAuth() {
        const { auth } = await import('./firebase-config.js');
        
        return new Promise((resolve) => {
            if (auth.currentUser) {
                resolve();
            } else {
                const unsubscribe = auth.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve();
                });
            }
        });
    }
    
    setupEventListeners() {
        // Mobile navigation toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
            
            // Close menu when clicking on nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                });
            });
        }
        
        // Dashboard actions
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }
        
        // Search and filters
        const searchInput = document.getElementById('dashboardSearchInput');
        const categoryFilter = document.getElementById('dashboardCategoryFilter');
        const typeFilter = document.getElementById('dashboardTypeFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.searchQuery = searchInput.value.trim();
                this.renderItems();
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.categoryFilter = categoryFilter.value;
                this.renderItems();
            });
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.typeFilter = typeFilter.value;
                this.renderItems();
            });
        }
        
        // Filter tabs
        document.querySelectorAll('.dashboard-filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Listen for new submissions
        window.addEventListener('storage', (e) => {
            if (e.key === 'utaLostFoundItems') {
                this.items = this.loadItems();
                this.updateStats();
                this.renderItems();
            }
        });
    }
    
    async loadItemsFromFirebase() {
        try {
            const { collection, getDocs, query, orderBy, where, or, and } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db, auth } = await import('./firebase-config.js');
            
            console.log('Loading items from Firebase...');
            const itemsCollection = collection(db, 'items');
            
            // Get current user
            const currentUser = auth.currentUser;
            let q;
            
            // Fetch all items and filter in JavaScript to handle both submittedBy and userId fields
            // This approach is more flexible and handles data structure variations
            const allItemsQuery = query(itemsCollection, orderBy('submittedAt', 'desc'));
            const querySnapshot = await getDocs(allItemsQuery);
            
            this.items = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                
                // Determine if item should be shown
                const isApproved = data.status === 'APPROVED';
                const isUserItem = currentUser && (
                    data.submittedBy === currentUser.uid || 
                    data.userId === currentUser.uid
                );
                
                // Show item if: approved OR (user is logged in AND it's their item)
                if (isApproved || isUserItem) {
                    const item = {
                        id: doc.id,
                        ...data,
                        // Ensure type field exists (use mode if type doesn't exist)
                        type: data.type || data.mode || 'LOST',
                        // Ensure submittedBy exists (use userId if submittedBy doesn't exist)
                        submittedBy: data.submittedBy || data.userId || null,
                        submittedAt: data.submittedAt?.toDate?.() || new Date(data.submittedAt),
                        // Set default values for new fields if they don't exist
                        isVisible: data.isVisible !== false, // Default to true if not set
                        isDeleted: data.isDeleted === true   // Default to false if not set
                    };
                    this.items.push(item);
                }
            });
            
            console.log(`✅ Loaded ${this.items.length} items from Firebase (approved + user's items)`);
        } catch (error) {
            console.error('Error loading items from Firebase:', error);
            // Fallback to localStorage
            this.loadItemsFromStorage();
        }
    }
    
    loadItemsFromStorage() {
        try {
            const stored = localStorage.getItem('utaLostFoundItems');
            const allItems = stored ? JSON.parse(stored) : [];
            // Only show approved items
            this.items = allItems.filter(item => item.status === 'APPROVED');
            console.log(`📦 Loaded ${this.items.length} approved items from localStorage`);
        } catch (error) {
            console.error('Error loading items from storage:', error);
            this.items = [];
        }
    }
    
    loadItems() {
        // Legacy method - now calls Firebase loading
        return this.loadItemsFromFirebase();
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        document.querySelectorAll('.dashboard-filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
        
        this.renderItems();
    }
    
    updateStats() {
        const total = this.items.length;
        const lost = this.items.filter(item => item.type === 'LOST' || item.mode === 'LOST').length;
        const found = this.items.filter(item => item.type === 'FOUND' || item.mode === 'FOUND').length;
        const pending = this.items.filter(item => item.status === 'PENDING').length;
        const claimed = this.items.filter(item => item.status === 'CLAIMED').length;
        
        this.updateStatCard('dashboardTotalItems', total);
        this.updateStatCard('dashboardLostItems', lost);
        this.updateStatCard('dashboardFoundItems', found);
        this.updateStatCard('dashboardPendingItems', pending);
        this.updateStatCard('dashboardClaimedItems', claimed);
    }
    
    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    renderItems() {
        const itemsGrid = document.getElementById('dashboardItemsGrid');
        if (!itemsGrid) return;
        
        const filteredItems = this.getFilteredItems();
        
        console.log(`📊 Dashboard: Rendering ${filteredItems.length} items (total: ${this.items.length})`);
        
        if (filteredItems.length === 0) {
            let message = '';
            if (this.items.length === 0) {
                message = `
                    <div class="dashboard-no-items">
                        <i class="fas fa-inbox"></i>
                        <h3>No items yet</h3>
                        <p>No items found in the system yet.</p>
                        <p><strong>Tip:</strong> Submit a new item - it will be automatically approved and visible!</p>
                        <a href="../index.html#submit" class="btn btn-primary" style="margin-top: 1rem;">
                            <i class="fas fa-plus"></i> Submit New Item
                        </a>
                    </div>
                `;
            } else {
                message = `
                    <div class="dashboard-no-items">
                        <i class="fas fa-filter"></i>
                        <h3>No items match your filters</h3>
                        <p>Try adjusting your search or filter criteria.</p>
                        <button onclick="dashboard.setFilter('all')" class="btn btn-secondary" style="margin-top: 1rem;">
                            <i class="fas fa-refresh"></i> Clear Filters
                        </button>
                    </div>
                `;
            }
            itemsGrid.innerHTML = message;
            return;
        }
        
        itemsGrid.innerHTML = filteredItems.map(item => this.createItemCard(item)).join('');
    }
    
    getFilteredItems() {
        let filtered = [...this.items];
        
        // First filter out hidden and deleted items
        filtered = filtered.filter(item => 
            item.isVisible !== false && item.isDeleted !== true
        );
        
        // Filter by type/status
        if (this.currentFilter !== 'all') {
            switch (this.currentFilter) {
                case 'lost':
                    filtered = filtered.filter(item => item.type === 'LOST' || item.mode === 'LOST');
                    break;
                case 'found':
                    filtered = filtered.filter(item => item.type === 'FOUND' || item.mode === 'FOUND');
                    break;
                case 'pending':
                    filtered = filtered.filter(item => item.status === 'PENDING');
                    break;
                case 'claimed':
                    filtered = filtered.filter(item => item.status === 'CLAIMED');
                    break;
            }
        }
        
        // Filter by type
        if (this.typeFilter) {
            filtered = filtered.filter(item => item.mode === this.typeFilter);
        }
        
        // Filter by category
        if (this.categoryFilter) {
            filtered = filtered.filter(item => item.category === this.categoryFilter);
        }
        
        // Search functionality
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                return (
                    item.title.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    (item.brand && item.brand.toLowerCase().includes(query)) ||
                    (item.uniqueId && item.uniqueId.toLowerCase().includes(query)) ||
                    (item.colors && item.colors.some(color => color.toLowerCase().includes(query)))
                );
            });
        }
        
        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        
        return filtered;
    }
    
    createItemCard(item) {
        const itemType = item.type || item.mode || 'LOST';
        const date = new Date(item.dateLost || item.dateFound || item.submittedAt).toLocaleDateString();
        const time = new Date(item.submittedAt).toLocaleString();
        const statusClass = item.status ? item.status.toLowerCase() : 'pending';
        
        // Get photos if available
        const photos = item.photos || item.uploadedPhotos || [];
        const hasPhotos = photos.length > 0;
        
        return `
            <div class="dashboard-item-card" data-item-id="${item.id}">
                <div class="dashboard-item-header">
                    <div class="dashboard-item-type ${itemType.toLowerCase()}">
                        ${itemType === 'LOST' ? '🔍 Lost Item' : '📦 Found Item'}
                    </div>
                    <div class="dashboard-item-status ${statusClass}">
                        ${this.getStatusIcon(item.status)} ${item.status || 'PENDING'}
                    </div>
                    <div class="dashboard-item-title">${this.escapeHtml(item.title)}</div>
                    <div class="dashboard-item-meta">
                        <span><i class="fas fa-calendar"></i> ${date}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(item.location)}</span>
                        <span><i class="fas fa-eye"></i> ${item.views || 0} views</span>
                        ${hasPhotos ? '<span><i class="fas fa-camera"></i> Has photos</span>' : ''}
                    </div>
                </div>
                
                <div class="dashboard-item-body">
                    ${hasPhotos ? `
                    <div class="dashboard-item-photos">
                        ${photos.slice(0, 3).map(photo => `
                            <div class="dashboard-photo-thumbnail" onclick="dashboard.showPhotoModal('${item.id}', '${photo.dataUrl || photo.url || photo}')">
                                <img src="${photo.dataUrl || photo.url || photo}" alt="Item photo" loading="lazy">
                            </div>
                        `).join('')}
                        ${photos.length > 3 ? `<div class="dashboard-photo-more">+${photos.length - 3}</div>` : ''}
                    </div>
                    ` : ''}
                    
                    <div class="dashboard-item-description">
                        ${this.escapeHtml(item.description)}
                    </div>
                    
                    <div class="dashboard-item-details">
                        <div class="dashboard-detail-item">
                            <div class="dashboard-detail-label">Category</div>
                            <div class="dashboard-detail-value">${this.formatCategory(item.category)}</div>
                        </div>
                        <div class="dashboard-detail-item">
                            <div class="dashboard-detail-label">Contact</div>
                            <div class="dashboard-detail-value">${item.contact === 'in-app' ? 'In-app messages' : 'Email notifications'}</div>
                        </div>
                        ${item.brand ? `
                        <div class="dashboard-detail-item">
                            <div class="dashboard-detail-label">Brand/Model</div>
                            <div class="dashboard-detail-value">${this.escapeHtml(item.brand)}</div>
                        </div>
                        ` : ''}
                        ${item.colors && item.colors.length > 0 ? `
                        <div class="dashboard-detail-item">
                            <div class="dashboard-detail-label">Colors</div>
                            <div class="dashboard-detail-value">${item.colors.join(', ')}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="dashboard-item-actions">
                    <button class="btn-dashboard btn-contact" onclick="dashboard.contactOwner('${item.id}')">
                        <i class="fas fa-envelope"></i> Contact
                    </button>
                    ${item.mode === 'FOUND' ? `
                    <button class="btn-dashboard btn-claim" onclick="dashboard.claimItem('${item.id}')">
                        <i class="fas fa-hand-holding"></i> Claim This
                    </button>
                    ` : ''}
                    <button class="btn-dashboard btn-details" onclick="dashboard.showItemDetails('${item.id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `;
    }
    
    formatCategory(category) {
        return category.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getStatusIcon(status) {
        switch (status) {
            case 'APPROVED': return '✅';
            case 'PENDING': return '⏳';
            case 'REJECTED': return '❌';
            case 'CLAIMED': return '🎉';
            default: return '⏳';
        }
    }
    
    contactOwner(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        
        const contactMethod = item.contact === 'in-app' ? 'in-app messaging' : 'email notifications';
        
        if (confirm(`Contact the owner of "${item.title}" via ${contactMethod}?`)) {
            // Increment views
            item.views = (item.views || 0) + 1;
            this.saveItems();
            
            alert(`📧 Contact request sent to the owner of "${item.title}"!\n\nYou will be notified when they respond.`);
        }
    }
    
    claimItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        
        const claimDetails = prompt(`📦 Claiming: "${item.title}"\n\nPlease provide details to prove ownership:\n- Describe unique features\n- Mention any identifying marks\n- Provide any serial numbers or codes`);
        
        if (claimDetails && claimDetails.trim().length > 10) {
            // Update item status
            item.status = 'CLAIMED';
            item.claimDetails = claimDetails.trim();
            item.claimedAt = new Date().toISOString();
            
            this.saveItems();
            this.renderItems();
            
            alert(`🎉 Claim submitted successfully!\n\nThe owner will be notified and can verify your claim.`);
        } else if (claimDetails !== null) {
            alert(`⚠️ Please provide more details to prove ownership (at least 10 characters).`);
        }
    }
    
    getPlaceholderImage(category, type) {
        // Generate category-specific placeholder images
        const colors = {
            'Electronics': '#3b82f6',
            'Clothing & Accessories': '#ef4444',
            'Books & Study Materials': '#10b981',
            'Personal Items': '#f59e0b',
            'Keys & ID Cards': '#8b5cf6',
            'Bags & Backpacks': '#06b6d4',
            'Sports Equipment': '#84cc16',
            'Other': '#6b7280'
        };
        
        const icons = {
            'Electronics': '📱',
            'Clothing & Accessories': '👕',
            'Books & Study Materials': '📚',
            'Personal Items': '💼',
            'Keys & ID Cards': '🔑',
            'Bags & Backpacks': '🎒',
            'Sports Equipment': '⚽',
            'Other': '📦'
        };
        
        const color = colors[category] || colors['Other'];
        const icon = icons[category] || icons['Other'];
        const typeColor = type === 'LOST' ? '#ef4444' : '#10b981';
        
        // Create SVG placeholder
        const svg = `
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="${color}" opacity="0.1"/>
                <rect x="20" y="20" width="160" height="160" rx="20" fill="${color}" opacity="0.2"/>
                <circle cx="100" cy="100" r="40" fill="${color}" opacity="0.3"/>
                <text x="100" y="110" text-anchor="middle" font-size="40" fill="${color}">${icon}</text>
                <rect x="10" y="10" width="180" height="180" rx="20" stroke="${typeColor}" stroke-width="3" fill="none"/>
                <text x="100" y="180" text-anchor="middle" font-size="12" fill="${typeColor}" font-weight="bold">${type}</text>
            </svg>
        `;
        
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    showPhotoModal(itemId, photoUrl) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay photo-modal';
        modal.innerHTML = `
            <div class="modal-content photo-modal-content">
                <div class="modal-header">
                    <h3>Item Photo</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <img src="${photoUrl}" alt="Item photo" class="photo-modal-image">
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    showItemDetails(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        
        // Increment views
        item.views = (item.views || 0) + 1;
        this.saveItems();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📋 Item Details</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="details-grid">
                        <div class="detail-section">
                            <h4>Basic Information</h4>
                            <p><strong>Title:</strong> ${this.escapeHtml(item.title)}</p>
                            <p><strong>Type:</strong> ${item.mode === 'LOST' ? '🔍 Lost Item' : '📦 Found Item'}</p>
                            <p><strong>Category:</strong> ${this.formatCategory(item.category)}</p>
                            <p><strong>Status:</strong> ${this.getStatusIcon(item.status)} ${item.status || 'PENDING'}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Description</h4>
                            <p>${this.escapeHtml(item.description)}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Location & Time</h4>
                            <p><strong>Date:</strong> ${new Date(item.date).toLocaleDateString()}</p>
                            <p><strong>Location:</strong> ${this.escapeHtml(item.location)}</p>
                            ${item.locationSpot ? `<p><strong>Specific Spot:</strong> ${this.escapeHtml(item.locationSpot)}</p>` : ''}
                            <p><strong>Submitted:</strong> ${new Date(item.submittedAt).toLocaleString()}</p>
                        </div>
                        
                        ${item.brand || item.colors?.length > 0 || item.uniqueId ? `
                        <div class="detail-section">
                            <h4>Item Details</h4>
                            ${item.brand ? `<p><strong>Brand/Model:</strong> ${this.escapeHtml(item.brand)}</p>` : ''}
                            ${item.colors?.length > 0 ? `<p><strong>Colors:</strong> ${item.colors.join(', ')}</p>` : ''}
                            ${item.uniqueId ? `<p><strong>Unique ID:</strong> ${this.escapeHtml(item.uniqueId)}</p>` : ''}
                        </div>
                        ` : ''}
                        
                        <div class="detail-section">
                            <h4>Contact Information</h4>
                            <p><strong>Contact Method:</strong> ${item.contact === 'in-app' ? 'In-app messages' : 'Email notifications'}</p>
                            <p><strong>Proof Required:</strong> ${item.proofRequired ? 'Yes' : 'No'}</p>
                        </div>
                        
                        ${item.claimDetails ? `
                        <div class="detail-section">
                            <h4>Claim Information</h4>
                            <p><strong>Claim Details:</strong> ${this.escapeHtml(item.claimDetails)}</p>
                            <p><strong>Claimed At:</strong> ${new Date(item.claimedAt).toLocaleString()}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    async refresh() {
        await this.loadItemsFromFirebase();
        this.updateStats();
        this.renderItems();
        
        // Show refresh feedback
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        if (refreshBtn) {
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-check"></i> Refreshed';
            refreshBtn.disabled = true;
            
            setTimeout(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
            }, 2000);
        }
    }
    
    saveItems() {
        localStorage.setItem('utaLostFoundItems', JSON.stringify(this.items));
        
        // Trigger storage event for other pages
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'utaLostFoundItems',
            newValue: JSON.stringify(this.items)
        }));
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});