// UTA Lost & Found - Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.items = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.categoryFilter = '';
        this.statusFilter = '';
        this.adminEmail = 'sxa6003@mavs.uta.edu'; // UTA Admin Email
        
        this.init();
    }
    
    async init() {
        // Check if user is on admin page
        if (window.location.pathname.includes('admin.html')) {
            this.checkAdminAccess();
        }
        this.setupEventListeners();
        await this.loadItemsFromFirebase();
        await this.loadNotifications();
        this.updateStats();
        this.renderItems();
        this.renderNotifications();
    }
    
    checkAdminAccess() {
        // Simple admin access check - in production, this would be more secure
        const isAdmin = confirm('Admin Access Required\n\nAre you an authorized UTA administrator?');
        if (!isAdmin) {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return;
        }
        console.log('Admin access granted');
    }
    
    setupEventListeners() {
        // Mobile navigation toggle
        const navToggle = document.querySelector('.nav-toggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                const navMenu = document.querySelector('.nav-menu');
                navMenu.classList.toggle('active');
            });
        }
        
        // Admin actions
        const refreshBtn = document.getElementById('refreshAdminBtn');
        const exportBtn = document.getElementById('exportDataBtn');
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        // Refresh notifications button
        const refreshNotificationsBtn = document.getElementById('refreshNotificationsBtn');
        if (refreshNotificationsBtn) {
            refreshNotificationsBtn.addEventListener('click', () => this.refreshNotifications());
        }
        
        // Search and filters
        const searchInput = document.getElementById('adminSearchInput');
        const categoryFilter = document.getElementById('adminCategoryFilter');
        const statusFilter = document.getElementById('adminStatusFilter');
        
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
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.statusFilter = statusFilter.value;
                this.renderItems();
            });
        }
        
        // Filter tabs
        document.querySelectorAll('.admin-filter-tab').forEach(tab => {
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
            const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('./firebase-config.js');
            
            console.log('Loading items from Firebase...');
            const itemsCollection = collection(db, 'items');
            const q = query(itemsCollection, orderBy('submittedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            
            this.items = [];
            querySnapshot.forEach((doc) => {
                const item = {
                    id: doc.id,
                    ...doc.data(),
                    submittedAt: doc.data().submittedAt?.toDate?.() || new Date(doc.data().submittedAt)
                };
                this.items.push(item);
            });
            
            console.log(`✅ Loaded ${this.items.length} items from Firebase`);
        } catch (error) {
            console.error('Error loading items from Firebase:', error);
            // Fallback to localStorage
            this.loadItemsFromStorage();
        }
    }
    
    loadItemsFromStorage() {
        try {
            const stored = localStorage.getItem('utaLostFoundItems');
            this.items = stored ? JSON.parse(stored) : [];
            console.log(`📦 Loaded ${this.items.length} items from localStorage`);
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
        document.querySelectorAll('.admin-filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
        
        this.renderItems();
    }
    
    updateStats() {
        const total = this.items.length;
        const pending = this.items.filter(item => item.status === 'PENDING').length;
        const approved = this.items.filter(item => item.status === 'APPROVED').length;
        const rejected = this.items.filter(item => item.status === 'REJECTED').length;
        const claimed = this.items.filter(item => item.status === 'CLAIMED').length;
        
        this.updateStatCard('adminTotalItems', total);
        this.updateStatCard('adminPendingItems', pending);
        this.updateStatCard('adminApprovedItems', approved);
        this.updateStatCard('adminRejectedItems', rejected);
        this.updateStatCard('adminClaimedItems', claimed);
    }
    
    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    renderItems() {
        const itemsGrid = document.getElementById('adminItemsGrid');
        if (!itemsGrid) return;
        
        const filteredItems = this.getFilteredItems();
        
        if (filteredItems.length === 0) {
            itemsGrid.innerHTML = `
                <div class="admin-no-items">
                    <i class="fas fa-inbox"></i>
                    <h3>No items found</h3>
                    <p>No items match the current filter criteria.</p>
                </div>
            `;
            return;
        }
        
        itemsGrid.innerHTML = filteredItems.map(item => this.createAdminItemCard(item)).join('');
    }
    
    getFilteredItems() {
        let filtered = [...this.items];
        
        // Filter by status
        if (this.currentFilter !== 'all') {
            switch (this.currentFilter) {
                case 'pending':
                    filtered = filtered.filter(item => item.status === 'PENDING');
                    break;
                case 'approved':
                    filtered = filtered.filter(item => item.status === 'APPROVED');
                    break;
                case 'rejected':
                    filtered = filtered.filter(item => item.status === 'REJECTED');
                    break;
                case 'claimed':
                    filtered = filtered.filter(item => item.status === 'CLAIMED');
                    break;
            }
        }
        
        // Filter by category
        if (this.categoryFilter) {
            filtered = filtered.filter(item => item.category === this.categoryFilter);
        }
        
        // Filter by status
        if (this.statusFilter) {
            filtered = filtered.filter(item => item.status === this.statusFilter);
        }
        
        // Search functionality
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                return (
                    item.title.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    item.utaEmail.toLowerCase().includes(query) ||
                    (item.brand && item.brand.toLowerCase().includes(query))
                );
            });
        }
        
        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        
        return filtered;
    }
    
    createAdminItemCard(item) {
        const date = new Date(item.date).toLocaleDateString();
        const submittedAt = new Date(item.submittedAt).toLocaleString();
        const statusClass = item.status ? item.status.toLowerCase() : 'pending';
        
        return `
            <div class="admin-item-card" data-item-id="${item.id}">
                <div class="admin-item-header">
                    <div class="admin-item-type ${item.mode.toLowerCase()}">
                        ${item.mode === 'LOST' ? '🔍 Lost Item' : '📦 Found Item'}
                    </div>
                    <div class="admin-item-status ${statusClass}">
                        ${this.getStatusIcon(item.status)} ${item.status || 'PENDING'}
                    </div>
                    <div class="admin-item-title">${this.escapeHtml(item.title)}</div>
                    <div class="admin-item-meta">
                        <span><i class="fas fa-calendar"></i> ${date}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(item.location)}</span>
                        <span><i class="fas fa-user"></i> ${this.escapeHtml(item.utaEmail)}</span>
                        <span><i class="fas fa-clock"></i> ${submittedAt}</span>
                    </div>
                </div>
                
                <div class="admin-item-body">
                    <div class="admin-item-description">
                        ${this.escapeHtml(item.description)}
                    </div>
                    
                    <div class="admin-item-details">
                        <div class="admin-detail-item">
                            <div class="admin-detail-label">Category</div>
                            <div class="admin-detail-value">${this.formatCategory(item.category)}</div>
                        </div>
                        <div class="admin-detail-item">
                            <div class="admin-detail-label">Contact</div>
                            <div class="admin-detail-value">${item.contact === 'in-app' ? 'In-app messages' : 'Email notifications'}</div>
                        </div>
                        <div class="admin-detail-item">
                            <div class="admin-detail-label">Views</div>
                            <div class="admin-detail-value">${item.views || 0}</div>
                        </div>
                        ${item.brand ? `
                        <div class="admin-detail-item">
                            <div class="admin-detail-label">Brand/Model</div>
                            <div class="admin-detail-value">${this.escapeHtml(item.brand)}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="admin-item-actions">
                    <button class="btn-admin btn-view" onclick="adminDashboard.viewItemDetails('${item.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${item.status === 'PENDING' ? `
                    <button class="btn-admin btn-approve" onclick="adminDashboard.approveItem('${item.id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-admin btn-reject" onclick="adminDashboard.rejectItem('${item.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    ` : ''}
                    <button class="btn-admin btn-edit" onclick="adminDashboard.editItem('${item.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-admin btn-delete" onclick="adminDashboard.deleteItem('${item.id}')">
                        <i class="fas fa-trash"></i> Delete
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
    
    viewItemDetails(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="admin-modal-content">
                <div class="admin-modal-header">
                    <h3>📋 Item Details - Admin View</h3>
                    <button class="admin-modal-close" onclick="this.closest('.admin-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="admin-modal-body">
                    <div class="admin-details-grid">
                        <div class="admin-detail-section">
                            <h4>Basic Information</h4>
                            <p><strong>Title:</strong> ${this.escapeHtml(item.title)}</p>
                            <p><strong>Type:</strong> ${item.mode === 'LOST' ? '🔍 Lost Item' : '📦 Found Item'}</p>
                            <p><strong>Category:</strong> ${this.formatCategory(item.category)}</p>
                            <p><strong>Status:</strong> ${this.getStatusIcon(item.status)} ${item.status || 'PENDING'}</p>
                            <p><strong>Submitted By:</strong> ${this.escapeHtml(item.utaEmail)}</p>
                        </div>
                        
                        <div class="admin-detail-section">
                            <h4>Description</h4>
                            <p>${this.escapeHtml(item.description)}</p>
                        </div>
                        
                        <div class="admin-detail-section">
                            <h4>Location & Time</h4>
                            <p><strong>Date:</strong> ${new Date(item.date).toLocaleDateString()}</p>
                            <p><strong>Location:</strong> ${this.escapeHtml(item.location)}</p>
                            ${item.locationSpot ? `<p><strong>Specific Spot:</strong> ${this.escapeHtml(item.locationSpot)}</p>` : ''}
                            <p><strong>Submitted:</strong> ${new Date(item.submittedAt).toLocaleString()}</p>
                        </div>
                        
                        ${item.brand || item.colors?.length > 0 || item.uniqueId ? `
                        <div class="admin-detail-section">
                            <h4>Item Details</h4>
                            ${item.brand ? `<p><strong>Brand/Model:</strong> ${this.escapeHtml(item.brand)}</p>` : ''}
                            ${item.colors?.length > 0 ? `<p><strong>Colors:</strong> ${item.colors.join(', ')}</p>` : ''}
                            ${item.uniqueId ? `<p><strong>Unique ID:</strong> ${this.escapeHtml(item.uniqueId)}</p>` : ''}
                        </div>
                        ` : ''}
                        
                        <div class="admin-detail-section">
                            <h4>Contact Information</h4>
                            <p><strong>Contact Method:</strong> ${item.contact === 'in-app' ? 'In-app messages' : 'Email notifications'}</p>
                            <p><strong>Proof Required:</strong> ${item.proofRequired ? 'Yes' : 'No'}</p>
                            <p><strong>Views:</strong> ${item.views || 0}</p>
                        </div>
                        
                        ${item.claimDetails ? `
                        <div class="admin-detail-section">
                            <h4>Claim Information</h4>
                            <p><strong>Claim Details:</strong> ${this.escapeHtml(item.claimDetails)}</p>
                            <p><strong>Claimed At:</strong> ${new Date(item.claimedAt).toLocaleString()}</p>
                        </div>
                        ` : ''}
                        
                        ${item.status === 'PENDING' ? `
                        <div class="admin-approval-form">
                            <h4>Admin Actions</h4>
                            <textarea id="adminNotes" placeholder="Add notes for approval/rejection..."></textarea>
                            <div class="admin-approval-actions">
                                <button class="btn-admin btn-approve" onclick="adminDashboard.approveItemWithNotes('${item.id}')">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="btn-admin btn-reject" onclick="adminDashboard.rejectItemWithNotes('${item.id}')">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            </div>
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
    
    async approveItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        
        if (confirm(`Approve "${item.title}"?`)) {
            try {
                // Update in Firebase
                const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                const { db } = await import('./firebase-config.js');
                
                await updateDoc(doc(db, 'items', itemId), {
                    status: 'APPROVED',
                    approvedAt: serverTimestamp(),
                    approvedBy: 'admin'
                });
                
                // Update local item
                item.status = 'APPROVED';
                item.approvedAt = new Date().toISOString();
                item.approvedBy = 'admin';
                
                this.updateStats();
                this.renderItems();
                
                alert(`✅ Item "${item.title}" has been approved and is now visible to users.`);
            } catch (error) {
                console.error('Error approving item:', error);
                alert('❌ Error approving item. Please try again.');
            }
        }
    }
    
    async rejectItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        
        const reason = prompt(`Reject "${item.title}"?\n\nPlease provide a reason for rejection:`);
        if (reason !== null) {
            try {
                // Update in Firebase
                const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                const { db } = await import('./firebase-config.js');
                
                await updateDoc(doc(db, 'items', itemId), {
                    status: 'REJECTED',
                    rejectedAt: serverTimestamp(),
                    rejectedBy: 'admin',
                    rejectionReason: reason.trim()
                });
                
                // Update local item
                item.status = 'REJECTED';
                item.rejectedAt = new Date().toISOString();
                item.rejectedBy = 'admin';
                item.rejectionReason = reason.trim();
                
                this.updateStats();
                this.renderItems();
                
                alert(`❌ Item "${item.title}" has been rejected.`);
            } catch (error) {
                console.error('Error rejecting item:', error);
                alert('❌ Error rejecting item. Please try again.');
            }
        }
    }
    
    approveItemWithNotes(itemId) {
        const item = this.items.find(i => i.id === itemId);
        const notes = document.getElementById('adminNotes')?.value || '';
        
        if (!item) return;
        
        item.status = 'APPROVED';
        item.approvedAt = new Date().toISOString();
        item.approvedBy = 'admin';
        item.adminNotes = notes.trim();
        
        this.saveItems();
        this.updateStats();
        this.renderItems();
        
        // Close modal
        document.querySelector('.admin-modal').remove();
        
        alert(`✅ Item "${item.title}" has been approved and is now visible to users.`);
    }
    
    rejectItemWithNotes(itemId) {
        const item = this.items.find(i => i.id === itemId);
        const notes = document.getElementById('adminNotes')?.value || '';
        
        if (!item) return;
        
        item.status = 'REJECTED';
        item.rejectedAt = new Date().toISOString();
        item.rejectedBy = 'admin';
        item.rejectionReason = notes.trim();
        
        this.saveItems();
        this.updateStats();
        this.renderItems();
        
        // Close modal
        document.querySelector('.admin-modal').remove();
        
        alert(`❌ Item "${item.title}" has been rejected.`);
    }
    
    editItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        
        // For now, just show an alert. In a real system, this would open an edit form
        alert(`Edit functionality for "${item.title}" would open an edit form.\n\nThis feature can be implemented with a modal form similar to the submission form.`);
    }
    
    async deleteItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        
        if (confirm(`⚠️ Are you sure you want to permanently delete "${item.title}"?\n\nThis action cannot be undone.`)) {
            try {
                const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                const { db } = await import('./firebase-config.js');
                
                // Delete from Firebase
                await deleteDoc(doc(db, 'items', itemId));
                
                // Update local array
                this.items = this.items.filter(i => i.id !== itemId);
                this.updateStats();
                this.renderItems();
                
                alert(`🗑️ Item "${item.title}" has been permanently deleted from the database.`);
            } catch (error) {
                console.error('Error deleting item:', error);
                alert('❌ Error deleting item. Please try again.');
            }
        }
    }
    
    exportData() {
        try {
            const data = {
                exportDate: new Date().toISOString(),
                totalItems: this.items.length,
                items: this.items
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `uta-lost-found-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert(`📊 Data exported successfully!\n\nTotal items: ${this.items.length}`);
        } catch (error) {
            console.error('Export error:', error);
            alert('❌ Error exporting data. Please try again.');
        }
    }
    
    async refresh() {
        await this.loadItemsFromFirebase();
        this.updateStats();
        this.renderItems();
        
        // Show refresh feedback
        const refreshBtn = document.getElementById('refreshAdminBtn');
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
    
    // Notification methods
    async loadNotifications() {
        try {
            if (window.emailNotificationService) {
                this.notifications = await window.emailNotificationService.getPendingNotifications();
                console.log(`📧 Loaded ${this.notifications.length} pending notifications`);
            } else {
                this.notifications = [];
                console.log('⚠️ Email notification service not available');
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.notifications = [];
        }
    }
    
    async refreshNotifications() {
        const refreshBtn = document.getElementById('refreshNotificationsBtn');
        if (refreshBtn) {
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            refreshBtn.disabled = true;
            
            try {
                await this.loadNotifications();
                this.renderNotifications();
                refreshBtn.innerHTML = '<i class="fas fa-check"></i> Refreshed';
                setTimeout(() => {
                    refreshBtn.innerHTML = originalText;
                    refreshBtn.disabled = false;
                }, 2000);
            } catch (error) {
                refreshBtn.innerHTML = '<i class="fas fa-times"></i> Error';
                setTimeout(() => {
                    refreshBtn.innerHTML = originalText;
                    refreshBtn.disabled = false;
                }, 2000);
            }
        }
    }
    
    renderNotifications() {
        const notificationsGrid = document.getElementById('adminNotificationsGrid');
        if (!notificationsGrid) return;
        
        if (this.notifications.length === 0) {
            notificationsGrid.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-inbox"></i>
                    <h3>No pending notifications</h3>
                    <p>All email notifications have been sent.</p>
                </div>
            `;
            return;
        }
        
        notificationsGrid.innerHTML = this.notifications.map(notification => this.createNotificationCard(notification)).join('');
    }
    
    createNotificationCard(notification) {
        const date = new Date(notification.createdAt).toLocaleDateString();
        const time = new Date(notification.createdAt).toLocaleTimeString();
        const priorityClass = notification.priority === 'HIGH' ? 'high-priority' : 'normal-priority';
        
        return `
            <div class="admin-notification-card ${priorityClass}">
                <div class="notification-header">
                    <div class="notification-type">
                        ${notification.type === 'CONTACT_REQUEST' ? '📧' : '🎯'} 
                        ${notification.type === 'CONTACT_REQUEST' ? 'Contact Request' : 'Claim Request'}
                    </div>
                    <div class="notification-date">${date} ${time}</div>
                </div>
                
                <div class="notification-content">
                    <h4>${notification.itemTitle}</h4>
                    <p><strong>To:</strong> ${notification.recipientEmail}</p>
                    <p><strong>From:</strong> ${notification.senderName} (${notification.senderEmail})</p>
                    <p><strong>Message:</strong> ${notification.message}</p>
                </div>
                
                <div class="notification-actions">
                    <button class="btn-admin btn-send" onclick="adminDashboard.sendNotification('${notification.id}')">
                        <i class="fas fa-paper-plane"></i> Send Email
                    </button>
                    <button class="btn-admin btn-mark-sent" onclick="adminDashboard.markNotificationSent('${notification.id}')">
                        <i class="fas fa-check"></i> Mark Sent
                    </button>
                </div>
            </div>
        `;
    }
    
    async sendNotification(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return;
        
        try {
            // Create mailto link
            const mailtoLink = `mailto:${notification.recipientEmail}?subject=${encodeURIComponent(notification.emailContent.subject)}&body=${encodeURIComponent(notification.emailContent.body)}`;
            
            // Open email client
            window.open(mailtoLink, '_blank');
            
            // Mark as sent
            await this.markNotificationSent(notificationId);
            
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('❌ Error sending notification. Please try again.');
        }
    }
    
    async markNotificationSent(notificationId) {
        try {
            if (window.emailNotificationService) {
                await window.emailNotificationService.markNotificationSent(notificationId);
                
                // Remove from local array
                this.notifications = this.notifications.filter(n => n.id !== notificationId);
                this.renderNotifications();
                
                alert('✅ Notification marked as sent');
            }
        } catch (error) {
            console.error('Error marking notification as sent:', error);
            alert('❌ Error marking notification as sent. Please try again.');
        }
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin dashboard initializing...');
    try {
        window.adminDashboard = new AdminDashboard();
        console.log('Admin dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing admin dashboard:', error);
    }
});
