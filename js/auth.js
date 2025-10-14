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
    
    // Validate UTA email format
    validateUtaEmail(email) {
        const utaEmailRegex = /^[a-zA-Z0-9._%+-]+@mavs\.uta\.edu$/i;
        return utaEmailRegex.test(email);
    }
    
    // Sign up new user
    async signUp(email, password, displayName) {
        try {
            // Validate UTA email
            if (!this.validateUtaEmail(email)) {
                throw new Error('Only @mavs.uta.edu emails are allowed');
            }
            
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update display name
            await updateProfile(user, { displayName });
            
            // Send email verification
            await sendEmailVerification(user);
            
            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: displayName,
                isAdmin: this.adminEmails.includes(email),
                createdAt: serverTimestamp(),
                emailVerified: false,
                lastLogin: null
            });
            
            return { success: true, user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Sign in existing user
    async signIn(email, password) {
        try {
            // Validate UTA email
            if (!this.validateUtaEmail(email)) {
                throw new Error('Only @mavs.uta.edu emails are allowed');
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
            window.location.href = 'login.html';
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
