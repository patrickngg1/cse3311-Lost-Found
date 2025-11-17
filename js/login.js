// UTA Lost & Found - Login Page JavaScript
import authManager from './auth.js';

class LoginPage {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }
    
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const forgotPasswordLink = document.getElementById('forgotPassword');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => this.handleForgotPassword(e));
        }
    }
    
    checkAuthState() {
        // If user is already logged in, redirect to dashboard
        if (authManager.isAuthenticated()) {
            window.location.href = 'pages/dashboard.html';
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validate inputs
        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        // Validate UTA email
        if (!authManager.validateUtaEmail(email)) {
            this.showError('Only @mavs.uta.edu (students) or @uta.edu (staff) emails are allowed');
            return;
        }
        
        // Show loading state
        this.setLoading(true);
        this.hideMessages();
        
        try {
            // Attempt login
            const result = await authManager.signIn(email, password);
            
            if (result.success) {
                this.showSuccess('Login successful! Redirecting...');
                
                // Redirect based on user type
                setTimeout(() => {
                    if (authManager.isUserAdmin()) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'pages/dashboard.html';
                    }
                }, 1500);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Login failed. Please try again.');
            console.error('Login error:', error);
        } finally {
            this.setLoading(false);
        }
    }
    
    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            this.showError('Please enter your email address first');
            return;
        }
        
        if (!authManager.validateUtaEmail(email)) {
            this.showError('Only @mavs.uta.edu (students) or @uta.edu (staff) emails are allowed');
            return;
        }
        
        try {
            const result = await authManager.resetPassword(email);
            
            if (result.success) {
                this.showSuccess('Password reset email sent! Check your inbox.');
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Failed to send reset email. Please try again.');
            console.error('Password reset error:', error);
        }
    }
    
    setLoading(loading) {
        const loginBtn = document.getElementById('loginBtn');
        const loadingEl = document.getElementById('loading');
        const loginText = document.getElementById('loginText');
        
        if (loading) {
            loginBtn.disabled = true;
            loadingEl.classList.add('show');
            loginText.textContent = 'Signing In...';
        } else {
            loginBtn.disabled = false;
            loadingEl.classList.remove('show');
            loginText.textContent = 'Sign In';
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
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 3000);
    }
    
    hideMessages() {
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
    }
}

// Initialize login page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});
