// UTA Lost & Found - Registration Page JavaScript
import authManager from './auth.js';

class RegisterPage {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }
    
    setupEventListeners() {
        const registerForm = document.getElementById('registerForm');
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Real-time password validation
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.validatePassword());
        }
        
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => this.validatePasswordMatch());
        }
    }
    
    checkAuthState() {
        // If user is already logged in, redirect to dashboard
        if (authManager.isAuthenticated()) {
            window.location.href = 'dashboard.html';
        }
    }
    
    validatePassword() {
        const password = document.getElementById('password').value;
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password)
        };
        
        // Update UI to show password requirements
        const requirementsList = document.querySelector('.password-requirements ul');
        if (requirementsList) {
            const items = requirementsList.querySelectorAll('li');
            items[0].style.color = requirements.length ? '#10b981' : '#ef4444';
            items[1].style.color = requirements.uppercase ? '#10b981' : '#ef4444';
            items[2].style.color = requirements.lowercase ? '#10b981' : '#ef4444';
            items[3].style.color = requirements.number ? '#10b981' : '#ef4444';
        }
        
        return Object.values(requirements).every(req => req);
    }
    
    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError('confirmPassword', 'Passwords do not match');
            return false;
        } else {
            this.clearFieldError('confirmPassword');
            return true;
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const displayName = document.getElementById('displayName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate inputs
        if (!displayName || !email || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }
        
        // Validate UTA email
        if (!authManager.validateUtaEmail(email)) {
            this.showError('Only @mavs.uta.edu emails are allowed');
            return;
        }
        
        // Validate password
        if (!this.validatePassword()) {
            this.showError('Password does not meet requirements');
            return;
        }
        
        // Validate password match
        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }
        
        // Show loading state
        this.setLoading(true);
        this.hideMessages();
        
        try {
            // Attempt registration
            const result = await authManager.signUp(email, password, displayName);
            
            if (result.success) {
                this.showSuccess('Account created! Please check your email for verification link.');
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Registration failed. Please try again.');
            console.error('Registration error:', error);
        } finally {
            this.setLoading(false);
        }
    }
    
    setLoading(loading) {
        const registerBtn = document.getElementById('registerBtn');
        const loadingEl = document.getElementById('loading');
        const registerText = document.getElementById('registerText');
        
        if (loading) {
            registerBtn.disabled = true;
            loadingEl.classList.add('show');
            registerText.textContent = 'Creating Account...';
        } else {
            registerBtn.disabled = false;
            loadingEl.classList.remove('show');
            registerText.textContent = 'Create Account';
        }
    }
    
    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        const successEl = document.getElementById('successMessage');
        
        successEl.style.display = 'none';
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
    
    showSuccess(message) {
        const errorEl = document.getElementById('errorMessage');
        const successEl = document.getElementById('successMessage');
        
        errorEl.style.display = 'none';
        successEl.textContent = message;
        successEl.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 5000);
    }
    
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '#ef4444';
            
            // Create or update error message
            let errorEl = field.parentNode.querySelector('.field-error');
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'field-error';
                errorEl.style.color = '#ef4444';
                errorEl.style.fontSize = '0.75rem';
                errorEl.style.marginTop = '4px';
                field.parentNode.appendChild(errorEl);
            }
            errorEl.textContent = message;
        }
    }
    
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '#e5e7eb';
            
            const errorEl = field.parentNode.querySelector('.field-error');
            if (errorEl) {
                errorEl.remove();
            }
        }
    }
    
    hideMessages() {
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
    }
}

// Initialize register page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RegisterPage();
});
