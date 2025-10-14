# Environment Setup Guide

This guide explains how to set up environment variables for the UTA Lost & Found System.

## Firebase Configuration

The application uses Firebase for authentication, database, and other services. You need to set up environment variables for your Firebase project.

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication, Firestore Database, and other required services

### 2. Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps" section
3. Click on the web app icon (`</>`) to add a web app
4. Copy the configuration values

### 3. Set Environment Variables

#### For Local Development

Create a `.env` file in the project root with the following variables:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id

# Application Settings
NODE_ENV=development
APP_NAME=UTA Lost & Found System
APP_VERSION=1.0.0

# Contact Information
ADMIN_EMAIL=lostfound@uta.edu
ADMIN_PHONE=(817) 272-2011
ADMIN_OFFICE=Student Union, Room 101
```

#### For Production Deployment (Netlify)

1. Go to your Netlify dashboard
2. Navigate to Site Settings > Environment Variables
3. Add each environment variable from the list above

#### For Production Deployment (Other Platforms)

Set the environment variables in your deployment platform's configuration:
- **Vercel**: Project Settings > Environment Variables
- **Heroku**: Settings > Config Vars
- **AWS**: Use AWS Systems Manager Parameter Store or AWS Secrets Manager

### 4. Security Notes

- Firebase client-side configuration is safe to expose in frontend code
- However, using environment variables provides better security practices
- Never commit `.env` files to version control
- The `.env` file is already included in `.gitignore`

### 5. Verification

After setting up environment variables:

1. Start the development server: `npm start`
2. Check the browser console for any Firebase initialization errors
3. Test user authentication and database operations

### 6. Troubleshooting

**Common Issues:**

1. **Firebase not initializing**: Check that all environment variables are set correctly
2. **Authentication errors**: Verify Firebase Authentication is enabled in the console
3. **Database errors**: Ensure Firestore Database is enabled and rules are configured

**Debug Steps:**

1. Check browser console for error messages
2. Verify environment variables are loaded: `console.log(process.env)`
3. Test Firebase connection in Firebase Console

### 7. Support

For technical support:
- Email: lostfound@uta.edu
- Phone: (817) 272-2011
- Office: Student Union, Room 101
