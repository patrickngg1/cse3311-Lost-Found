/**
 * UTA Lost & Found - Authentication System
 * 
 * This module handles all authentication-related functionality including:
 * - User registration with UTA email verification
 * - User login and logout
 * - Password reset functionality
 * - Admin role management
 * - Session management and state tracking
 * 
 * @author UTA IT Department
 * @version 1.0.0
 * @since 2024-01-01
 */

// Import Firebase Authentication functions
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Import Firestore functions for user data management
import { doc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Import Firebase configuration
import { auth, db, firebaseReady } from './firebase-config.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.adminEmails = ['sxa6003@mavs.uta.edu']; // UTA Admin emails
        this.initialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Wait for Firebase to be ready
            await firebaseReady;
            
            // Listen for authentication state changes
            onAuthStateChanged(auth, (user) => {
                this.currentUser = user;
                this.checkAdminStatus();
                this.updateUI();
                this.initialized = true;
                console.log('Auth state changed:', user ? 'Logged in' : 'Logged out');
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    }
    
    // Check if current user is admin
    checkAdminStatus() {
        if (this.currentUser && this.adminEmails.includes(this.currentUser.email)) {
            this.isAdmin = true;
        } else {
            this.isAdmin = false;
        }
    }
    
    // Validate UTA email format - allows both @mavs.uta.edu (students) and @uta.edu (staff)
    validateUtaEmail(email) {
        const utaEmailRegex = /^[a-zA-Z0-9._%+-]+@(mavs\.)?uta\.edu$/i;
        return utaEmailRegex.test(email);
    }
    
    // Validate password strength
    isStrongPassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    }
    
    // Get user-friendly error messages
    getErrorMessage(error) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email is already registered. Please try logging in instead.',
            'auth/weak-password': 'Password is too weak. Please use a stronger password.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection and try again.',
            'auth/user-disabled': 'This account has been disabled. Please contact support.'
        };
        
        return errorMessages[error.code] || error.message || 'An unexpected error occurred. Please try again.';
    }
    
    // Show user messages
    showMessage(type, message) {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `auth-message auth-message-${type}`;
        messageEl.innerHTML = `
            <div class="auth-message-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
                <button class="auth-message-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add to page
        const container = document.querySelector('.auth-container, .login-container, .register-container');
        if (container) {
            container.insertBefore(messageEl, container.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (messageEl.parentElement) {
                    messageEl.remove();
                }
            }, 5000);
        }
    }
    
    // Sign up new user
    async signUp(email, password, displayName) {
        try {
            // Validate UTA email
            if (!this.validateUtaEmail(email)) {
                throw new Error('Only @mavs.uta.edu (students) or @uta.edu (staff) emails are allowed');
            }
            
            // Validate password strength
            if (!this.isStrongPassword(password)) {
                throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
            }
            
            // Validate display name
            if (!displayName || displayName.trim().length < 2) {
                throw new Error('Please enter a valid name (at least 2 characters)');
            }
            
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update display name
            await updateProfile(user, { displayName: displayName.trim() });
            
            // Send email verification
            await sendEmailVerification(user);
            
            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: displayName.trim(),
                isAdmin: this.adminEmails.includes(email),
                createdAt: serverTimestamp(),
                emailVerified: false,
                lastLogin: null,
                profileComplete: false
            });
            
            // Show success message
            this.showMessage('success', 'Account created successfully! Please check your email to verify your account.');
            
            return { success: true, user, needsVerification: true };
        } catch (error) {
            console.error('Sign up error:', error);
            const errorMessage = this.getErrorMessage(error);
            this.showMessage('error', errorMessage);
            return { success: false, error: errorMessage };
        }
    }
    
    // Sign in existing user
    async signIn(email, password) {
        try {
            // Validate UTA email
            if (!this.validateUtaEmail(email)) {
                throw new Error('Only @mavs.uta.edu (students) or @uta.edu (staff) emails are allowed');
            }
            
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Check if email is verified
            if (!user.emailVerified) {
                await sendEmailVerification(user);
                throw new Error('Please verify your email before signing in. Check your inbox for verification link.');
            }
            
            // Update last login time
            try {
                await setDoc(doc(db, 'users', user.uid), {
                    lastLogin: serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.warn('Failed to update last login:', error);
            }
            
            return { success: true, user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Sign out user
    async signOut() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Send password reset email
    async resetPassword(email) {
        try {
            if (!this.validateUtaEmail(email)) {
                throw new Error('Only @mavs.uta.edu emails are allowed');
            }
            
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Check if auth system is ready
    isReady() {
        return this.initialized;
    }
    
    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null && this.currentUser.emailVerified;
    }
    
    // Check if user is admin
    isUserAdmin() {
        return this.isAdmin;
    }
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Update UI based on auth state
    updateUI() {
        const authElements = document.querySelectorAll('.auth-required');
        const adminElements = document.querySelectorAll('.admin-required');
        const guestElements = document.querySelectorAll('.guest-only');
        
        if (this.isAuthenticated()) {
            // Show authenticated content
            authElements.forEach(el => el.style.display = 'block');
            guestElements.forEach(el => el.style.display = 'none');
            
            // Show admin content if admin
            if (this.isUserAdmin()) {
                adminElements.forEach(el => el.style.display = 'block');
            } else {
                adminElements.forEach(el => el.style.display = 'none');
            }
            
            // Update user info in UI
            this.updateUserInfo();
        } else {
            // Show guest content
            authElements.forEach(el => el.style.display = 'none');
            adminElements.forEach(el => el.style.display = 'none');
            guestElements.forEach(el => el.style.display = 'block');
        }
    }
    
    // Update user information in UI
    updateUserInfo() {
        if (this.currentUser) {
            const userEmailEl = document.getElementById('userEmail');
            const userNameEl = document.getElementById('userName');
            const adminBadgeEl = document.getElementById('adminBadge');
            
            if (userEmailEl) userEmailEl.textContent = this.currentUser.email;
            if (userNameEl) userNameEl.textContent = this.currentUser.displayName || 'UTA User';
            if (adminBadgeEl) {
                adminBadgeEl.style.display = this.isUserAdmin() ? 'inline' : 'none';
            }
        }
    }
    
    // Require authentication for protected routes
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'pages/login.html';
            return false;
        }
        return true;
    }
    
    // Require admin access
    requireAdmin() {
        if (!this.requireAuth()) return false;
        if (!this.isUserAdmin()) {
            alert('Admin access required');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
}

// Initialize auth manager
window.authManager = new AuthManager();

// Export for use in other files
export default window.authManager;
