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
// For production, environment variables should be set in your deployment platform
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: process.env.FIREBASE_APP_ID || "your-app-id",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "your-measurement-id"
};

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

// Export the main Firebase app instance
export default app;
