/**
 * Firebase Configuration for UTA Lost & Found System
 * 
 * This file contains the Firebase project configuration and initializes
 * all Firebase services used throughout the application.
 * 
 * Services Used:
 * - Authentication: User login/registration with UTA email verification
 * - Firestore: NoSQL database for storing lost/found items and user data
 * - Functions: Server-side logic for email notifications and matching
 * - Analytics: Usage tracking and performance monitoring
 * 
 * @author UTA IT Department
 * @version 1.0.0
 * @since 2024-01-01
 */

// Firebase project configuration
// Note: These are public configuration values and safe to expose in client-side code
// For Netlify deployment, environment variables are injected at build time
// For local development, we use the fallback values

// Helper function to get environment variable for Netlify
function getEnvVar(key, fallback) {
  // Check for Netlify environment variables (available in browser)
  if (typeof window !== 'undefined' && window.process && window.process.env) {
    return window.process.env[key] || fallback;
  }
  // Check for build-time environment variables
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  // For Netlify, environment variables are available as global variables
  if (typeof window !== 'undefined' && window[key]) {
    return window[key];
  }
  // Fallback to default values
  return fallback;
}

const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY', "AIzaSyCnH3YyYNU0RO-ohpqaaZ2-ak1C52-gsXI"),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', "utalostandfound-42797.firebaseapp.com"),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', "utalostandfound-42797"),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', "utalostandfound-42797.firebasestorage.app"),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', "404965401963"),
  appId: getEnvVar('FIREBASE_APP_ID', "1:404965401963:web:b8051d3c08b3915b9c982e"),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID', "G-CRBYQ80ESQ")
};

// Log configuration for debugging (remove in production)
console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey
});

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

/**
 * Initialize Firebase application with the provided configuration
 * @type {FirebaseApp}
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Authentication service
 * Handles user login, registration, and session management
 * @type {Auth}
 */
export const auth = getAuth(app);

/**
 * Firestore database service
 * NoSQL database for storing lost/found items, user data, and matches
 * @type {Firestore}
 */
export const db = getFirestore(app);

/**
 * Firebase Functions service
 * Server-side functions for email notifications and item matching
 * @type {Functions}
 */
export const functions = getFunctions(app);

/**
 * Firebase Analytics service
 * Only initialized in production environment for performance tracking
 * @type {Analytics|null}
 */
let analytics = null;
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  try {
    analytics = getAnalytics(app);
    console.log('Firebase Analytics initialized successfully');
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}
export { analytics };

/**
 * Promise that resolves when Firebase services are ready
 * Used to ensure all services are initialized before making API calls
 * @type {Promise<boolean>}
 */
export const firebaseReady = new Promise((resolve) => {
  if (auth && db) {
    console.log('Firebase services initialized successfully');
    resolve(true);
  } else {
    console.warn('Firebase services initialization timeout');
    setTimeout(() => resolve(false), 1000);
  }
});

// Initialize EmailJS if configured (after DOM loads)
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (typeof emailjs !== 'undefined') {
            const emailjsConfig = {
                serviceId: window.EMAILJS_SERVICE_ID || '',
                templateId: window.EMAILJS_TEMPLATE_ID || '',
                userId: window.EMAILJS_USER_ID || ''
            };
            
            if (emailjsConfig.serviceId && emailjsConfig.templateId && emailjsConfig.userId) {
                emailjs.init(emailjsConfig.userId);
                window.EMAILJS_CONFIG = emailjsConfig;
                console.log('✅ EmailJS initialized');
            } else {
                console.log('ℹ️ EmailJS not configured - using notification queue system');
            }
        }
    });
}

// Export the main Firebase app instance
export default app;
