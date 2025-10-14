// UTA Lost & Found - Complete JavaScript System
class UTALostFound {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 6;
        this.formData = {};
        this.selectedColors = new Set();
        this.uploadedPhotos = [];
        this.items = [];
        this.searchQuery = '';
        this.categoryFilter = '';
        this.typeFilter = '';
        this.currentPage = 1;
        this.itemsPerPage = 12;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 UTALostFound initializing...');
            this.setupEventListeners();
            this.initializeForm();
            this.setupNavigation();
            this.setupAuthIntegration();
            
            // Wait for Firebase to be ready before loading browse items
            console.log('⏳ Waiting for Firebase to be ready...');
            if (window.firebaseReady) {
                await window.firebaseReady;
                console.log('✅ Firebase is ready');
            } else {
                console.log('⚠️ Firebase ready promise not found, proceeding anyway');
            }
            
            console.log('🔄 Loading browse items from Firebase...');
            await this.loadBrowseItemsFromFirebase();
            
            // Update stats after loading items
            await this.updateStats();
            
            console.log('✅ UTALostFound initialization complete');
        } catch (error) {
            console.error('❌ Error during UTALostFound initialization:', error);
            this.showErrorMessage('Failed to initialize the application. Please refresh the page.');
        }
    }
    
    setupAuthIntegration() {
        // Check if user is authenticated
        if (window.authManager) {
            // Listen for auth state changes
            window.authManager.updateUI();
            
            // Redirect to login if not authenticated and trying to submit
            const submitSection = document.getElementById('submit');
            if (submitSection) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !window.authManager.isAuthenticated()) {
                            // Show login prompt
                            this.showLoginPrompt();
                        }
                    });
                });
                observer.observe(submitSection);
            }
        }
    }
    
    showLoginPrompt() {
        const loginPrompt = document.createElement('div');
        loginPrompt.className = 'login-prompt';
        loginPrompt.innerHTML = `
            <div class="login-prompt-content">
                <h3>🔐 Login Required</h3>
                <p>Please log in with your UTA email to submit items.</p>
                <div class="login-prompt-actions">
                    <a href="login.html" class="btn btn-primary">Login</a>
                    <a href="register.html" class="btn btn-secondary">Create Account</a>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .login-prompt {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .login-prompt-content {
                background: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                max-width: 400px;
                margin: 20px;
            }
            .login-prompt-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 20px;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(loginPrompt);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (loginPrompt.parentNode) {
                loginPrompt.remove();
                style.remove();
            }
        }, 10000);
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const target = link.getAttribute('href');
                if (target.startsWith('#')) {
                    e.preventDefault();
                    this.scrollToSection(target);
                }
                // Allow normal navigation for .html files
                // Don't prevent default for admin.html, dashboard.html, etc.
            });
        });
        
        // Mobile navigation toggle
        const navToggle = document.querySelector('.nav-toggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                const navMenu = document.querySelector('.nav-menu');
                navMenu.classList.toggle('active');
            });
        }
        
        // Quick action cards
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', () => {
                const action = card.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        // Form navigation
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        if (submitBtn) submitBtn.addEventListener('click', (e) => this.handleSubmit(e));
        
        // Form field listeners
        this.setupFormListeners();
        
        // Browse functionality
        this.setupBrowseListeners();
        
        // Success screen actions
        const submitAnother = document.getElementById('submitAnother');
        if (submitAnother) {
            submitAnother.addEventListener('click', () => this.resetForm());
        }
    }
    
    setupFormListeners() {
        // Mode change
        document.querySelectorAll('input[name="mode"]').forEach(input => {
            input.addEventListener('change', () => this.handleModeChange());
        });
        
        // Real-time validation
        const form = document.getElementById('itemForm');
        if (form) {
            form.addEventListener('input', (e) => this.validateField(e.target));
            form.addEventListener('blur', (e) => this.validateField(e.target));
        }
        
        // Color chips
        document.querySelectorAll('.color-chip').forEach(chip => {
            chip.addEventListener('click', () => this.toggleColorChip(chip));
        });
        
        // File upload
        this.setupFileUpload();
        
        // Date validation
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.addEventListener('change', () => this.validateDate());
        }
    }
    
    setupBrowseListeners() {
        // Search
        const searchInput = document.getElementById('browseSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.searchQuery = searchInput.value.trim();
                this.loadBrowseItems();
            });
        }
        
        // Filters
        const categoryFilter = document.getElementById('categoryFilter');
        const typeFilter = document.getElementById('typeFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.categoryFilter = categoryFilter.value;
                this.loadBrowseItems();
            });
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.typeFilter = typeFilter.value;
                this.loadBrowseItems();
            });
        }
        
        // Load more
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreItems());
        }
        
        // Refresh browse items
        const refreshBrowseBtn = document.getElementById('refreshBrowseBtn');
        if (refreshBrowseBtn) {
            refreshBrowseBtn.addEventListener('click', () => this.refreshBrowseItems());
        }
    }
    
    setupFileUpload() {
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileInput = document.getElementById('photos');
        
        if (fileUploadArea && fileInput) {
            // Click to upload
            fileUploadArea.addEventListener('click', () => fileInput.click());
            
            // Drag and drop
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.classList.add('dragover');
            });
            
            fileUploadArea.addEventListener('dragleave', () => {
                fileUploadArea.classList.remove('dragover');
            });
            
            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.classList.remove('dragover');
                this.handleFileUpload(e.dataTransfer.files);
            });
            
            // File input change
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
        }
    }
    
    setupNavigation() {
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Update active nav link on scroll
        window.addEventListener('scroll', () => this.updateActiveNavLink());
    }
    
    scrollToSection(target) {
        const element = document.querySelector(target);
        if (element) {
            const offsetTop = element.offsetTop - 70; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }
    
    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    handleQuickAction(action) {
        switch (action) {
            case 'lost':
            case 'found':
                this.scrollToSection('#submit');
                // Auto-select the appropriate mode
                setTimeout(() => {
                    const modeInput = document.querySelector(`input[name="mode"][value="${action.toUpperCase()}"]`);
                    if (modeInput) {
                        modeInput.checked = true;
                        this.handleModeChange();
                    }
                }, 500);
                break;
            case 'browse':
                this.scrollToSection('#browse');
                break;
            case 'claim':
                this.scrollToSection('#browse');
                break;
        }
    }
    
    initializeForm() {
        // Set default date to today
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
        
        // Initialize form state
        this.updateFormNavigation();
    }
    
    handleModeChange() {
        const selectedMode = document.querySelector('input[name="mode"]:checked')?.value;
        const dateLabel = document.getElementById('date-label');
        const descriptionHelp = document.getElementById('description-help');
        const proofRequirement = document.getElementById('proof-requirement');
        const proofRequired = document.getElementById('proofRequired');
        
        if (selectedMode === 'LOST') {
            if (dateLabel) dateLabel.textContent = 'Date you last had it';
            if (descriptionHelp) descriptionHelp.textContent = 'Where/how you lost it, unique marks/serial, contents';
            if (proofRequirement) proofRequirement.style.display = 'none';
            if (proofRequired) {
                proofRequired.required = false;
                proofRequired.checked = false;
            }
        } else if (selectedMode === 'FOUND') {
            if (dateLabel) dateLabel.textContent = 'Date you found it';
            if (descriptionHelp) descriptionHelp.textContent = 'Where you found it, condition, any identifying info';
            if (proofRequirement) proofRequirement.style.display = 'block';
            if (proofRequired) proofRequired.required = true;
        }
        
        this.clearFieldError('mode-error');
    }
    
    toggleColorChip(chip) {
        const color = chip.dataset.color;
        if (this.selectedColors.has(color)) {
            this.selectedColors.delete(color);
            chip.classList.remove('selected');
        } else {
            this.selectedColors.add(color);
            chip.classList.add('selected');
        }
    }
    
    handleFileUpload(files) {
        const maxFiles = 4;
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];
        
        this.clearFieldError('photos-error');
        
        // Check file count
        if (this.uploadedPhotos.length + files.length > maxFiles) {
            this.showError('photos-error', `You can upload up to ${maxFiles} photos.`);
            return;
        }
        
        Array.from(files).forEach(file => {
            // Check file type
            if (!allowedTypes.includes(file.type)) {
                this.showError('photos-error', 'Only JPG, PNG, and HEIC files are allowed.');
                return;
            }
            
            // Check file size
            if (file.size > maxSize) {
                this.showError('photos-error', 'Each photo must be ≤ 5 MB.');
                return;
            }
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                this.addPhotoPreview(file, e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }
    
    addPhotoPreview(file, dataUrl) {
        const photoPreview = document.getElementById('photoPreview');
        if (!photoPreview) return;
        
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        photoItem.innerHTML = `
            <img src="${dataUrl}" alt="Uploaded photo">
            <button type="button" class="photo-remove" onclick="utaLostFound.removePhoto(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        photoPreview.appendChild(photoItem);
        this.uploadedPhotos.push({ file, dataUrl });
    }
    
    removePhoto(button) {
        const photoItem = button.closest('.photo-item');
        const index = Array.from(photoItem.parentNode.children).indexOf(photoItem);
        
        photoItem.remove();
        this.uploadedPhotos.splice(index, 1);
    }
    
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateFormDisplay();
                this.updateFormNavigation();
            }
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateFormDisplay();
            this.updateFormNavigation();
        }
    }
    
    updateFormDisplay() {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStepElement = document.querySelector(`[data-step="${this.currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }
    }
    
    updateFormNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
        }
        
        if (nextBtn) {
            nextBtn.style.display = this.currentStep < this.totalSteps ? 'inline-flex' : 'none';
        }
        
        if (submitBtn) {
            submitBtn.style.display = this.currentStep === this.totalSteps ? 'inline-flex' : 'none';
        }
    }
    
    validateCurrentStep() {
        const currentStepElement = document.querySelector(`[data-step="${this.currentStep}"]`);
        if (!currentStepElement) return true;
        
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    validateField(field) {
        if (!field) return true;
        
        const fieldName = field.name || field.id;
        let isValid = true;
        
        switch (fieldName) {
            case 'mode':
                isValid = this.validateMode();
                break;
            case 'title':
                isValid = this.validateTitle();
                break;
            case 'category':
                isValid = this.validateCategory();
                break;
            case 'description':
                isValid = this.validateDescription();
                break;
            case 'date':
                isValid = this.validateDate();
                break;
            case 'location':
                isValid = this.validateLocation();
                break;
            case 'utaEmail':
                isValid = this.validateUtaEmail();
                break;
            case 'contact':
                isValid = this.validateContact();
                break;
            case 'visibilityConsent':
                isValid = this.validateVisibilityConsent();
                break;
            case 'proofRequired':
                isValid = this.validateProofRequired();
                break;
        }
        
        return isValid;
    }
    
    validateMode() {
        const mode = document.querySelector('input[name="mode"]:checked');
        this.clearFieldError('mode-error');
        
        if (!mode) {
            this.showError('mode-error', 'Please select whether this is a lost or found item');
            return false;
        }
        
        return true;
    }
    
    validateTitle() {
        const titleInput = document.getElementById('title');
        if (!titleInput) return true;
        
        const value = titleInput.value.trim();
        this.clearFieldError('title-error');
        
        if (!value) {
            this.showError('title-error', 'Please enter a title for your item');
            return false;
        }
        
        if (value.length < 4) {
            this.showError('title-error', 'Title must be at least 4 characters long');
            return false;
        }
        
        if (value.length > 80) {
            this.showError('title-error', 'Title must be less than 80 characters');
            return false;
        }
        
        return true;
    }
    
    validateCategory() {
        const categoryInput = document.getElementById('category');
        if (!categoryInput) return true;
        
        const value = categoryInput.value;
        this.clearFieldError('category-error');
        
        if (!value) {
            this.showError('category-error', 'Please choose a category for your item');
            return false;
        }
        
            return true;
        }
        
    validateDescription() {
        const descriptionInput = document.getElementById('description');
        if (!descriptionInput) return true;
        
        const value = descriptionInput.value.trim();
        this.clearFieldError('description-error');
        
        if (!value) {
            this.showError('description-error', 'Please describe your item in detail');
            return false;
        }
        
        if (value.length < 20) {
            this.showError('description-error', 'Description must be at least 20 characters long');
            return false;
        }
        
        if (value.length > 1000) {
            this.showError('description-error', 'Description must be less than 1000 characters');
            return false;
        }
        
        return true;
    }
    
    validateDate() {
        const dateInput = document.getElementById('date');
        if (!dateInput) return true;
        
        const value = dateInput.value;
        this.clearFieldError('date-error');
        
        if (!value) {
            this.showError('date-error', 'Please select a date');
            return false;
        }
        
        const selectedDate = new Date(value);
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        
        if (selectedDate > today) {
            this.showError('date-error', 'Please select a date that is not in the future');
            return false;
        }
        
        if (selectedDate < sixMonthsAgo) {
            this.showError('date-error', 'Please select a date within the last 6 months');
            return false;
        }
        
        return true;
    }
    
    validateLocation() {
        const locationInput = document.getElementById('location');
        if (!locationInput) return true;
        
        const value = locationInput.value;
        this.clearFieldError('location-error');
        
        if (!value) {
            this.showError('location-error', 'Please select a location');
            return false;
        }
        
            return true;
        }
        
    validateUtaEmail() {
        const utaEmailInput = document.getElementById('utaEmail');
        if (!utaEmailInput) return true;
        
        const value = utaEmailInput.value.trim();
        this.clearFieldError('utaEmail-error');
        
        if (!value) {
            this.showError('utaEmail-error', 'Please enter your UTA email address');
            return false;
        }
        
        const utaEmailRegex = /^[a-zA-Z0-9._%+-]+@mavs\.uta\.edu$/i;
        if (!utaEmailRegex.test(value)) {
            this.showError('utaEmail-error', 'Please enter a valid @mavs.uta.edu email address');
            return false;
        }
        
        return true;
    }
    
    validateContact() {
        const contactInput = document.querySelector('input[name="contact"]:checked');
        this.clearFieldError('contact-error');
        
        if (!contactInput) {
            this.showError('contact-error', 'Please choose a contact method');
            return false;
        }
        
        return true;
    }
    
    validateVisibilityConsent() {
        const visibilityConsent = document.getElementById('visibilityConsent');
        if (!visibilityConsent) return true;
        
        this.clearFieldError('visibility-error');
        
        if (!visibilityConsent.checked) {
            this.showError('visibility-error', 'Please agree to show the item publicly');
            return false;
        }
        
        return true;
    }
    
    validateProofRequired() {
        const selectedMode = document.querySelector('input[name="mode"]:checked')?.value;
        const proofRequired = document.getElementById('proofRequired');
        
        this.clearFieldError('proof-error');
        
        if (selectedMode === 'FOUND' && proofRequired && !proofRequired.checked) {
            this.showError('proof-error', 'For found items, you must agree to ask for proof of ownership');
            return false;
        }
        
        return true;
    }
    
    showError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }
    
    clearFieldError(fieldOrErrorId) {
        let errorId;
        
        if (typeof fieldOrErrorId === 'string') {
            errorId = fieldOrErrorId;
        } else {
            const fieldName = fieldOrErrorId.name || fieldOrErrorId.id;
            errorId = `${fieldName}-error`;
        }
        
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        // Validate all steps
        if (!this.validateAllSteps()) {
            this.scrollToFirstError();
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }
        
        try {
            await this.submitForm();
            this.showSuccessScreen();
        } catch (error) {
            console.error('Submission error:', error);
            alert('There was an error submitting your item. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }
    
    validateAllSteps() {
        let isValid = true;
        
        for (let step = 1; step <= this.totalSteps; step++) {
            const stepElement = document.querySelector(`[data-step="${step}"]`);
            if (stepElement) {
                const requiredFields = stepElement.querySelectorAll('[required]');
                requiredFields.forEach(field => {
                    if (!this.validateField(field)) {
                        isValid = false;
                    }
                });
            }
        }
        
        return isValid;
    }
    
    scrollToFirstError() {
            const firstError = document.querySelector('.error-message.show');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
    async submitForm() {
        // Check if user is authenticated
        if (window.authManager) {
            // Wait for auth to be ready
            if (!window.authManager.isReady()) {
                console.log('Auth not ready, waiting...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (!window.authManager.isAuthenticated()) {
                alert('Please log in to submit items.');
                window.location.href = 'login.html';
                return;
            }
        } else {
            console.warn('Auth manager not available, using fallback');
        }
        
        // Collect form data
        const itemData = {
            mode: document.querySelector('input[name="mode"]:checked').value,
            title: document.getElementById('title').value.trim(),
            category: document.getElementById('category').value,
            description: document.getElementById('description').value.trim(),
            brand: document.getElementById('brand').value.trim(),
            uniqueId: document.getElementById('uniqueId').value.trim(),
            date: document.getElementById('date').value,
            location: document.getElementById('location').value,
            locationSpot: document.getElementById('location-spot').value.trim(),
            utaEmail: window.authManager ? window.authManager.getCurrentUser()?.email : document.getElementById('utaEmail').value.trim(),
            contact: document.querySelector('input[name="contact"]:checked').value,
            visibilityConsent: document.getElementById('visibilityConsent').checked,
            proofRequired: document.getElementById('proofRequired')?.checked || false,
            colors: Array.from(this.selectedColors),
            colorCustom: document.getElementById('color-custom').value.trim(),
            photos: this.uploadedPhotos.map(photo => photo.dataUrl),
            userName: window.authManager ? window.authManager.getCurrentUser()?.displayName : 'UTA User',
            userId: window.authManager ? window.authManager.getCurrentUser()?.uid : null
        };
        
        try {
            // Save to Firebase if available
            if (window.authManager && window.authManager.isAuthenticated()) {
                console.log('Saving to Firebase...');
                await this.saveItemToFirebase(itemData);
                console.log('✅ Saved to Firebase successfully');
            } else {
                console.log('Saving to localStorage...');
        this.saveItemToStorage(itemData);
                console.log('✅ Saved to localStorage successfully');
            }
            
            // Send email notifications (optional)
            if (window.emailNotifications) {
                try {
                    await window.emailNotifications.sendItemSubmissionEmail(itemData.utaEmail, itemData);
                    await window.emailNotifications.sendAdminNotification(itemData);
                    console.log('✅ Email notifications sent');
                } catch (emailError) {
                    console.warn('Email notification failed:', emailError);
                    // Don't fail the whole submission for email errors
                }
            }
            
                console.log('Form submitted with data:', itemData);
        } catch (error) {
            console.error('Error submitting form:', error);
            throw error;
        }
    }
    
    async saveItemToFirebase(itemData) {
        try {
            const { collection, addDoc, serverTimestamp, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('./firebase-config.js');
            
            const firebaseItem = {
                ...itemData,
                status: 'PENDING',
                submittedAt: serverTimestamp(),
                views: 0,
                matches: []
            };
            
            console.log('Saving item to Firebase:', firebaseItem);
            const docRef = await addDoc(collection(db, 'items'), firebaseItem);
            console.log('✅ Item saved to Firebase with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Firebase save error:', error);
            // Fallback to localStorage if Firebase fails
            console.log('Falling back to localStorage...');
            this.saveItemToStorage(itemData);
            throw error;
        }
    }
    
    saveItemToStorage(itemData) {
        try {
            const existingItems = JSON.parse(localStorage.getItem('utaLostFoundItems') || '[]');
            
            const newItem = {
                id: Date.now().toString(),
                ...itemData,
                status: 'PENDING',
                submittedAt: new Date().toISOString(),
                views: 0,
                matches: []
            };
            
            existingItems.unshift(newItem);
            localStorage.setItem('utaLostFoundItems', JSON.stringify(existingItems));
            
            // Trigger storage event
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'utaLostFoundItems',
                newValue: JSON.stringify(existingItems)
            }));
            
        } catch (error) {
            console.error('Error saving item to storage:', error);
        }
    }
    
    showSuccessScreen() {
        const selectedMode = document.querySelector('input[name="mode"]:checked').value;
        const title = document.getElementById('title').value;
        const successMessage = document.getElementById('successMessage');
        
        if (successMessage) {
            successMessage.textContent = selectedMode === 'LOST' 
                ? `Your lost item "${title}" has been submitted and is pending review.`
                : `Your found item "${title}" has been submitted and is pending review.`;
        }
        
        document.getElementById('itemForm').style.display = 'none';
        document.getElementById('successScreen').style.display = 'flex';
    }
    
    resetForm() {
        document.getElementById('itemForm').reset();
        document.getElementById('itemForm').style.display = 'block';
        document.getElementById('successScreen').style.display = 'none';
        
        // Reset state
        this.currentStep = 1;
        this.selectedColors.clear();
        this.uploadedPhotos = [];
        
        // Clear all errors
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.remove('show');
            el.textContent = '';
        });
        
        // Clear color chips
        document.querySelectorAll('.color-chip').forEach(chip => {
            chip.classList.remove('selected');
        });
        
        // Clear photo preview
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) {
            photoPreview.innerHTML = '';
        }
        
        // Reset form display
        this.updateFormDisplay();
        this.updateFormNavigation();
        this.initializeForm();
    }
    
    loadItems() {
        try {
            const stored = localStorage.getItem('utaLostFoundItems');
            return stored ? JSON.parse(stored) : this.generateSampleData();
    } catch (error) {
            console.error('Error loading items:', error);
            return this.generateSampleData();
        }
    }
    
    generateSampleData() {
        const sampleItems = [
            {
                id: '1',
                mode: 'LOST',
                title: 'iPhone 13 Pro in Black Case',
                category: 'electronics',
                description: 'Lost my iPhone 13 Pro in a black leather case near the Central Library. Has a small scratch on the back camera and a white sticker on the back. Last seen on the 3rd floor study area.',
                brand: 'Apple iPhone 13 Pro',
                uniqueId: 'IMEI: 123456789012345',
                date: '2024-01-15',
                location: 'library',
                locationSpot: '3rd floor study area',
                utaEmail: 'john.doe@mavs.uta.edu',
                contact: 'in-app',
                colors: ['black'],
                status: 'PENDING',
                submittedAt: '2024-01-15T10:30:00Z',
                photos: [],
                views: 15,
                matches: []
            },
            {
                id: '2',
                mode: 'FOUND',
                title: 'Blue Water Bottle',
                category: 'other',
                description: 'Found a blue water bottle in the Maverick Activities Center locker room. Brand appears to be Hydro Flask with some stickers on it. Left in men\'s locker room.',
                brand: 'Hydro Flask',
                date: '2024-01-14',
                location: 'gym',
                locationSpot: 'Men\'s locker room',
                utaEmail: 'jane.smith@mavs.uta.edu',
                contact: 'email',
                colors: ['blue'],
                status: 'APPROVED',
                submittedAt: '2024-01-14T15:45:00Z',
                photos: [],
                views: 8,
                matches: []
            },
            {
                id: '3',
                mode: 'FOUND',
                title: 'Black Backpack',
                category: 'bags',
                description: 'Found a black backpack near the Student Center cafeteria. It has a laptop compartment and several pockets. No identifying marks visible. Contains some notebooks and pens.',
                brand: 'Unknown',
                date: '2024-01-13',
                location: 'cafeteria',
                locationSpot: 'Near entrance',
                utaEmail: 'mike.wilson@mavs.uta.edu',
                contact: 'in-app',
                colors: ['black'],
                status: 'APPROVED',
                submittedAt: '2024-01-13T12:20:00Z',
                photos: [],
                views: 22,
                matches: []
            },
            {
                id: '4',
                mode: 'LOST',
                title: 'UTA Student ID Card',
                category: 'id_card',
                description: 'Lost my UTA student ID card. Name: Sarah Johnson. Last used at the library printer. Please contact if found.',
                brand: 'UTA',
                date: '2024-01-12',
                location: 'library',
                locationSpot: 'Printer area',
                utaEmail: 'sarah.johnson@mavs.uta.edu',
                contact: 'email',
                colors: ['blue'],
                status: 'PENDING',
                submittedAt: '2024-01-12T09:15:00Z',
                photos: [],
                views: 5,
                matches: []
            }
        ];
        
        localStorage.setItem('utaLostFoundItems', JSON.stringify(sampleItems));
        return sampleItems;
    }
    
    async loadBrowseItemsFromFirebase() {
        try {
            console.log('🔄 Starting to load browse items from Firebase...');
            const { collection, getDocs, query, orderBy, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('./firebase-config.js');
            
            console.log('📡 Firebase modules loaded, querying database...');
            const itemsCollection = collection(db, 'items');
            const q = query(
                itemsCollection, 
                where('status', '==', 'APPROVED')
            );
            const querySnapshot = await getDocs(q);
            
            console.log(`📊 Query returned ${querySnapshot.size} documents`);
            
            this.items = [];
            querySnapshot.forEach((doc) => {
                const itemData = doc.data();
                console.log('📄 Processing item:', doc.id, itemData.title, itemData.status);
                const item = {
                    id: doc.id,
                    ...itemData,
                    submittedAt: itemData.submittedAt?.toDate?.() || new Date(itemData.submittedAt)
                };
                this.items.push(item);
            });
            
            // Sort by date (newest first) on client side
            this.items.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            
            console.log(`✅ Loaded ${this.items.length} approved items for browse:`, this.items.map(i => i.title));
            this.loadBrowseItems();
    } catch (error) {
            console.error('❌ Error loading browse items from Firebase:', error);
            // Fallback to localStorage
            this.loadItemsFromStorage();
            this.loadBrowseItems();
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
    
    loadBrowseItems() {
        console.log('🎨 Rendering browse items...');
        const itemsGrid = document.getElementById('itemsGrid');
        if (!itemsGrid) {
            console.log('❌ itemsGrid not found');
            return;
        }
        
        // Show loading state if items are being loaded
        if (this.items.length === 0) {
            itemsGrid.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading items...</p>
                </div>
            `;
            return;
        }
        
        console.log(`📋 Total items available: ${this.items.length}`);
        const filteredItems = this.getFilteredItems();
        console.log(`🔍 Filtered items: ${filteredItems.length}`);
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const itemsToShow = filteredItems.slice(0, endIndex);
        
        console.log(`📄 Items to show: ${itemsToShow.length}`);
        
        if (itemsToShow.length === 0) {
            console.log('📭 No items to display, showing empty state');
            const searchQuery = document.getElementById('browseSearch')?.value || '';
            const categoryFilter = document.getElementById('categoryFilter')?.value || '';
            const typeFilter = document.getElementById('typeFilter')?.value || '';
            
            let message = 'No items have been posted yet.';
            let actionText = 'Be the first to submit a lost or found item!';
            
            if (searchQuery || categoryFilter || typeFilter) {
                message = 'No items found matching your search criteria.';
                actionText = 'Try adjusting your filters or search terms.';
            }
            
            itemsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>No Items Found</h3>
                    <p>${message}</p>
                    <p class="empty-action">${actionText}</p>
                    ${!searchQuery && !categoryFilter && !typeFilter ? `
                        <a href="#submit" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Submit First Item
                        </a>
                    ` : `
                        <button onclick="document.getElementById('browseSearch').value=''; document.getElementById('categoryFilter').value=''; document.getElementById('typeFilter').value=''; window.utaLostFound.loadBrowseItems();" class="btn btn-secondary">
                            <i class="fas fa-refresh"></i>
                            Clear Filters
                        </button>
                    `}
                </div>
            `;
            return;
        }
        
        console.log('🎨 Rendering item cards...');
        itemsGrid.innerHTML = itemsToShow.map(item => this.createItemCard(item)).join('');
        
        // Update load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = endIndex < filteredItems.length ? 'block' : 'none';
        }
        
        console.log('✅ Browse items rendered successfully');
    }
    
    getFilteredItems() {
        let filtered = [...this.items];
        
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
        const date = new Date(item.date).toLocaleDateString();
        const time = new Date(item.submittedAt).toLocaleString();
        const statusClass = item.status ? item.status.toLowerCase() : 'pending';
        
        return `
            <div class="item-card" data-item-id="${item.id}">
                <!-- Item Header -->
                <div class="item-header">
                    <div class="item-badges">
                        <div class="item-type ${item.mode.toLowerCase()}">
                            ${item.mode === 'LOST' ? '🔍 Lost Item' : '📦 Found Item'}
                        </div>
                        <div class="item-status ${statusClass}">
                            ${this.getStatusIcon(item.status)} ${item.status || 'PENDING'}
                        </div>
                    </div>
                    <h3 class="item-title">${this.escapeHtml(item.title)}</h3>
                    <div class="item-meta">
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>${date}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${this.escapeHtml(item.location)}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-eye"></i>
                            <span>${item.views || 0} views</span>
                        </div>
                    </div>
                </div>
                
                <!-- Item Body -->
                <div class="item-body">
                    <div class="item-description">
                        <p>${this.escapeHtml(item.description)}</p>
                    </div>
                    
                    <div class="item-details-grid">
                        <div class="detail-item">
                            <div class="detail-label">
                                <i class="fas fa-tag"></i>
                                Category
                            </div>
                            <div class="detail-value">${this.formatCategory(item.category)}</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">
                                <i class="fas fa-envelope"></i>
                                Contact Method
                            </div>
                            <div class="detail-value">${item.contact === 'in-app' ? 'In-app messages' : 'Email notifications'}</div>
                        </div>
                        
                        ${item.brand ? `
                        <div class="detail-item">
                            <div class="detail-label">
                                <i class="fas fa-barcode"></i>
                                Brand/Model
                            </div>
                            <div class="detail-value">${this.escapeHtml(item.brand)}</div>
                        </div>
                        ` : ''}
                        
                        ${item.colors && item.colors.length > 0 ? `
                        <div class="detail-item">
                            <div class="detail-label">
                                <i class="fas fa-palette"></i>
                                Colors
                            </div>
                            <div class="detail-value">
                                <div class="color-tags">
                                    ${item.colors.map(color => `<span class="color-tag">${color}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Item Actions -->
                <div class="item-actions">
                    <button class="btn-action btn-primary-action" onclick="utaLostFound.contactOwner('${item.id}')">
                        <i class="fas fa-envelope"></i>
                        <span>Contact Owner</span>
                    </button>
                    ${item.mode === 'FOUND' ? `
                    <button class="btn-action btn-claim-action" onclick="utaLostFound.claimItem('${item.id}')">
                        <i class="fas fa-hand-holding"></i>
                        <span>Claim This Item</span>
                    </button>
                    ` : ''}
                    <button class="btn-action btn-secondary-action" onclick="utaLostFound.showItemDetails('${item.id}')">
                        <i class="fas fa-info-circle"></i>
                        <span>View Details</span>
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
    
    async contactOwner(itemId) {
        console.log('🔍 Contact button clicked for item:', itemId);
        
        // Check if user is authenticated
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            console.log('❌ User not authenticated, redirecting to login');
            alert('🔐 Please login to contact item owners.\n\nYou need a UTA email account to use this feature.');
            window.location.href = 'login.html';
            return;
        }
        
        const item = this.items.find(i => i.id === itemId);
        if (!item) {
            console.log('❌ Item not found:', itemId);
            return;
        }
        
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) {
            console.log('❌ Unable to get current user');
            alert('❌ Unable to get user information. Please try logging in again.');
            return;
        }
        
        console.log('✅ User authenticated, showing contact modal for item:', item.title);
        
        // Show contact modal
        const message = await this.showContactModal(item);
        if (!message) {
            console.log('❌ User cancelled contact modal');
            return; // User cancelled
        }
        
        try {
            console.log('🔄 Starting contact request process...');
            
            // Send contact notification via Firebase Cloud Functions
            console.log('📦 Importing Firebase modules...');
            const { collection, addDoc, serverTimestamp, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('./firebase-config.js');
            console.log('✅ Firebase modules imported successfully');
            
            // Create contact request document
            console.log('📝 Creating contact request document...');
            const contactRequest = {
                itemId: itemId,
                itemTitle: item.title,
                itemOwnerEmail: item.utaEmail,
                requesterEmail: currentUser.email,
                requesterName: currentUser.displayName || currentUser.email,
                message: message,
                status: 'PENDING',
                createdAt: serverTimestamp(),
                itemMode: item.mode
            };
            
            console.log('💾 Saving contact request to Firebase...');
            const docRef = await addDoc(collection(db, 'contactRequests'), contactRequest);
            contactRequest.id = docRef.id;
            console.log('✅ Contact request saved with ID:', docRef.id);
            
            // Send email notification
            if (window.emailNotificationService) {
                await window.emailNotificationService.sendContactNotification(contactRequest);
            }
            
            // Increment views in Firebase
            try {
                const itemRef = doc(db, 'items', item.id);
                await updateDoc(itemRef, {
                    views: (item.views || 0) + 1
                });
                console.log('✅ Item views incremented in Firebase');
            } catch (viewError) {
                console.warn('⚠️ Could not increment views:', viewError);
            }
            
            alert(`📧 Contact request sent to ${item.utaEmail}!\n\nThey will receive an email notification about your interest in "${item.title}".\n\nYou will be notified when they respond.`);
            
        } catch (error) {
            console.error('Error sending contact request:', error);
            alert('❌ Error sending contact request. Please try again.');
        }
    }
    
    async claimItem(itemId) {
        // Check if user is authenticated
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            alert('🔐 Please login to claim items.\n\nYou need a UTA email account to use this feature.');
            window.location.href = 'login.html';
            return;
        }
        
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) {
            alert('❌ Unable to get user information. Please try logging in again.');
            return;
        }
        
        const claimDetails = prompt(`📦 Claiming: "${item.title}"\n\nPlease provide details to prove ownership:\n- Describe unique features\n- Mention any identifying marks\n- Provide any serial numbers or codes`);
        
        if (claimDetails && claimDetails.trim().length > 10) {
            try {
                // Update item status in Firebase
                const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                const { db } = await import('./firebase-config.js');
                
                await updateDoc(doc(db, 'items', itemId), {
                    status: 'CLAIMED',
                    claimDetails: claimDetails.trim(),
                    claimedAt: serverTimestamp(),
                    claimedBy: currentUser.email,
                    claimedByName: currentUser.displayName || currentUser.email
                });
                
                // Send email notification to item owner
                if (window.emailNotificationService) {
                    await window.emailNotificationService.sendClaimNotification(
                        item, 
                        currentUser.email, 
                        currentUser.displayName || currentUser.email
                    );
                }
                
                // Update local item
                item.status = 'CLAIMED';
                item.claimDetails = claimDetails.trim();
                item.claimedAt = new Date().toISOString();
                item.claimedBy = currentUser.email;
                item.claimedByName = currentUser.displayName || currentUser.email;
                
                this.loadBrowseItems();
                
                alert(`🎉 Claim submitted successfully!\n\nThe owner (${item.utaEmail}) will be notified and can verify your claim.`);
                
            } catch (error) {
                console.error('Error submitting claim:', error);
                alert('❌ Error submitting claim. Please try again.');
            }
        } else if (claimDetails !== null) {
            alert(`⚠️ Please provide more details to prove ownership (at least 10 characters).`);
        }
    }
    
    async showContactModal(item) {
        console.log('🎨 Creating contact modal for item:', item.title);
        
        return new Promise((resolve) => {
            // Create modal HTML
            const modalHTML = `
                <div id="contactModal" class="modal-overlay">
                    <div class="modal-content contact-modal">
                        <div class="modal-header">
                            <h3>📧 Contact Item Owner</h3>
                            <button class="modal-close" id="modalCloseBtn">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="contact-item-info">
                                <h4>${item.title}</h4>
                                <p><strong>Type:</strong> ${item.mode === 'LOST' ? 'Lost Item' : 'Found Item'}</p>
                                <p><strong>Category:</strong> ${item.category}</p>
                                <p><strong>Location:</strong> ${item.location}</p>
                            </div>
                            
                            <div class="contact-form">
                                <label for="contactMessage">Your message to the owner:</label>
                                <textarea 
                                    id="contactMessage" 
                                    placeholder="Hi! I think I may have found your item. Please contact me so we can arrange a meeting to verify ownership..."
                                    rows="6"
                                ></textarea>
                                
                                <div class="contact-preview">
                                    <h5>Email Preview:</h5>
                                    <div class="email-preview">
                                        <p><strong>To:</strong> ${item.utaEmail}</p>
                                        <p><strong>From:</strong> ${window.authManager.getCurrentUser().displayName || window.authManager.getCurrentUser().email}</p>
                                        <p><strong>Subject:</strong> UTA Lost & Found: Someone is interested in your ${item.mode.toLowerCase()} item</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="modalCancelBtn">Cancel</button>
                            <button class="btn btn-primary" id="modalSendBtn">Send Message</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add event listeners
            const modal = document.getElementById('contactModal');
            const closeBtn = document.getElementById('modalCloseBtn');
            const cancelBtn = document.getElementById('modalCancelBtn');
            const sendBtn = document.getElementById('modalSendBtn');
            
            const closeModal = () => {
                modal.remove();
                resolve(null);
            };
            
            closeBtn.addEventListener('click', closeModal);
            cancelBtn.addEventListener('click', closeModal);
            
            sendBtn.addEventListener('click', () => {
                const textarea = document.getElementById('contactMessage');
                const message = textarea ? textarea.value.trim() : '';
                
                if (!message) {
                    alert('Please enter a message before sending.');
                    return;
                }
                
                modal.remove();
                resolve(message);
            });
            
            // Focus on textarea
            setTimeout(() => {
                const textarea = document.getElementById('contactMessage');
                if (textarea) textarea.focus();
            }, 100);
            
            console.log('✅ Contact modal created and displayed');
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
    
    async refreshBrowseItems() {
        const refreshBtn = document.getElementById('refreshBrowseBtn');
        if (refreshBtn) {
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            refreshBtn.disabled = true;
            
            try {
                await this.loadBrowseItemsFromFirebase();
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
    
    loadMoreItems() {
        this.currentPage++;
        this.loadBrowseItems();
    }
    
    saveItems() {
        try {
            localStorage.setItem('utaLostFoundItems', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving items to localStorage:', error);
            this.showErrorMessage('Failed to save data. Please try again.');
        }
    }
    
    showErrorMessage(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="error-close">&times;</button>
            </div>
        `;
        
        // Add styles if not already added
        if (!document.getElementById('error-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'error-notification-styles';
            style.textContent = `
                .error-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #fee2e2;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    padding: 12px 16px;
                    color: #dc2626;
                    z-index: 1000;
                    max-width: 400px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .error-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .error-close {
                    background: none;
                    border: none;
                    color: #dc2626;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: auto;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    async updateStats() {
        try {
            // Get stats from Firebase
            const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('./firebase-config.js');
            
            // Get total items (all statuses)
            const allItemsQuery = query(collection(db, 'items'));
            const allItemsSnapshot = await getDocs(allItemsQuery);
            const totalItems = allItemsSnapshot.size;
            
            // Get recovered items (CLAIMED status)
            const claimedItemsQuery = query(collection(db, 'items'), where('status', '==', 'CLAIMED'));
            const claimedItemsSnapshot = await getDocs(claimedItemsQuery);
            const recoveredItems = claimedItemsSnapshot.size;
            
            // Get unique users from all items
            const allItems = allItemsSnapshot.docs.map(doc => doc.data());
            const activeUsers = new Set(allItems.map(item => item.utaEmail)).size;
            
            // Update DOM elements
            const totalItemsEl = document.getElementById('totalItems');
            const recoveredItemsEl = document.getElementById('recoveredItems');
            const activeUsersEl = document.getElementById('activeUsers');
            
            if (totalItemsEl) totalItemsEl.textContent = totalItems;
            if (recoveredItemsEl) recoveredItemsEl.textContent = recoveredItems;
            if (activeUsersEl) activeUsersEl.textContent = activeUsers;
            
            console.log('📊 Hero stats updated:', { totalItems, recoveredItems, activeUsers });
        } catch (error) {
            console.error('Error updating hero stats:', error);
            // Fallback to local data
            const totalItems = this.items.length;
            const recoveredItems = this.items.filter(item => item.status === 'CLAIMED').length;
            const activeUsers = new Set(this.items.map(item => item.utaEmail)).size;
            
            const totalItemsEl = document.getElementById('totalItems');
            const recoveredItemsEl = document.getElementById('recoveredItems');
            const activeUsersEl = document.getElementById('activeUsers');
            
            if (totalItemsEl) totalItemsEl.textContent = totalItems;
            if (recoveredItemsEl) recoveredItemsEl.textContent = recoveredItems;
            if (activeUsersEl) activeUsersEl.textContent = activeUsers;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM Content Loaded - Initializing UTALostFound...');
    window.utaLostFound = new UTALostFound();
    console.log('✅ UTALostFound instance created:', window.utaLostFound);
});

// Global functions for inline event handlers
window.removePhoto = function(button) {
    if (window.utaLostFound) {
        window.utaLostFound.removePhoto(button);
    }
};

