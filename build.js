#!/usr/bin/env node

/**
 * Build script for Netlify deployment
 * This script injects environment variables into the Firebase configuration
 * for production deployment on Netlify
 */

const fs = require('fs');
const path = require('path');

// Environment variables from Netlify
const envVars = {
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || "AIzaSyCnH3YyYNU0RO-ohpqaaZ2-ak1C52-gsXI",
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || "utalostandfound-42797.firebaseapp.com",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "utalostandfound-42797",
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || "utalostandfound-42797.firebasestorage.app",
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || "404965401963",
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || "1:404965401963:web:b8051d3c08b3915b9c982e",
  FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID || "G-CRBYQ80ESQ"
};

// Create environment variables injection script
const envScript = `
// Environment variables injected at build time
window.FIREBASE_API_KEY = "${envVars.FIREBASE_API_KEY}";
window.FIREBASE_AUTH_DOMAIN = "${envVars.FIREBASE_AUTH_DOMAIN}";
window.FIREBASE_PROJECT_ID = "${envVars.FIREBASE_PROJECT_ID}";
window.FIREBASE_STORAGE_BUCKET = "${envVars.FIREBASE_STORAGE_BUCKET}";
window.FIREBASE_MESSAGING_SENDER_ID = "${envVars.FIREBASE_MESSAGING_SENDER_ID}";
window.FIREBASE_APP_ID = "${envVars.FIREBASE_APP_ID}";
window.FIREBASE_MEASUREMENT_ID = "${envVars.FIREBASE_MEASUREMENT_ID}";
`;

// Write the environment script
fs.writeFileSync(path.join(__dirname, 'js', 'env.js'), envScript);

console.log('✅ Environment variables injected successfully');
console.log('📦 Build completed for Netlify deployment');
