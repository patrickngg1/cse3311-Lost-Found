# 🏗️ UTA Lost & Found - Project Structure

## 📁 Directory Organization

```
uta-lost-found/
├── 📄 index.html                    # Main entry point and landing page
├── 📄 package.json                  # Project configuration and dependencies
├── 📄 .gitignore                    # Git ignore rules
├── 📄 PROJECT_STRUCTURE.md          # This file - project structure documentation
│
├── 📁 src/                          # Source code directory
│   ├── 📁 pages/                    # HTML pages
│   │   ├── 📄 index.html            # Landing page (moved from root)
│   │   ├── 📄 login.html            # User login page
│   │   ├── 📄 register.html         # User registration page
│   │   ├── 📄 dashboard.html        # User dashboard
│   │   ├── 📄 admin.html            # Admin dashboard
│   │   ├── 📄 lost.html             # Lost item reporting page
│   │   └── 📄 found.html            # Found item reporting page
│   │
│   ├── 📁 js/                       # JavaScript files
│   │   ├── 📄 firebase-config.js    # Firebase configuration and initialization
│   │   ├── 📄 auth.js               # Authentication system
│   │   ├── 📄 login.js              # Login page functionality
│   │   ├── 📄 register.js           # Registration page functionality
│   │   ├── 📄 dashboard.js          # Dashboard functionality
│   │   ├── 📄 admin.js              # Admin dashboard functionality
│   │   ├── 📄 script.js             # Main application logic
│   │   ├── 📄 email-notifications.js # Email notification system
│   │   └── 📄 sw.js                 # Service worker for PWA
│   │
│   ├── 📁 css/                      # Stylesheets
│   │   └── 📄 styles.css            # Main stylesheet
│   │
│   ├── 📁 config/                   # Configuration files
│   │   ├── 📄 manifest.json         # PWA manifest
│   │   ├── 📄 netlify.toml          # Netlify deployment configuration
│   │   └── 📄 _redirects            # URL redirects for SPA
│   │
│   └── 📁 assets/                   # Static assets
│       ├── 📁 images/               # Image files
│       │   ├── 📄 hero-illustration.svg
│       │   ├── 📄 uta-logo.png
│       │   └── 📄 placeholder-item.jpg
│       │
│       └── 📁 icons/                # Icon files
│           ├── 📄 favicon.ico
│           ├── 📄 icon-192.png
│           └── 📄 icon-512.png
│
└── 📁 docs/                         # Documentation
    ├── 📄 README.md                 # Main project documentation
    ├── 📄 ITERATION_1.md            # Iteration 1 documentation
    └── 📄 DEPLOY.md                 # Deployment instructions
```

## 🎯 File Purposes

### **Root Files**
- **`index.html`**: Main entry point, serves as the landing page
- **`package.json`**: Project configuration, scripts, and metadata
- **`.gitignore`**: Specifies files to ignore in version control
- **`PROJECT_STRUCTURE.md`**: This documentation file

### **Source Code (`src/`)**

#### **Pages (`src/pages/`)**
- **`index.html`**: Landing page with hero section and features
- **`login.html`**: User authentication page
- **`register.html`**: User registration page
- **`dashboard.html`**: Main user dashboard
- **`admin.html`**: Administrative dashboard
- **`lost.html`**: Lost item reporting form
- **`found.html`**: Found item reporting form

#### **JavaScript (`src/js/`)**
- **`firebase-config.js`**: Firebase initialization and configuration
- **`auth.js`**: Authentication system and user management
- **`login.js`**: Login page specific functionality
- **`register.js`**: Registration page specific functionality
- **`dashboard.js`**: Dashboard functionality and user interactions
- **`admin.js`**: Admin dashboard functionality
- **`script.js`**: Main application logic and utilities
- **`email-notifications.js`**: Email notification system
- **`sw.js`**: Service worker for Progressive Web App features

#### **Stylesheets (`src/css/`)**
- **`styles.css`**: Main stylesheet with all CSS rules

#### **Configuration (`src/config/`)**
- **`manifest.json`**: PWA manifest for app installation
- **`netlify.toml`**: Netlify deployment configuration
- **`_redirects`**: URL redirects for single-page application routing

#### **Assets (`src/assets/`)**
- **`images/`**: All image files used in the application
- **`icons/`**: Favicon and app icons for different platforms

### **Documentation (`docs/`)**
- **`README.md`**: Comprehensive project documentation
- **`ITERATION_1.md`**: Iteration 1 planning and documentation
- **`DEPLOY.md`**: Deployment instructions and guidelines

## 🔧 Development Workflow

### **Local Development**
1. **Start Server**: `npm start` or `python -m http.server 8000`
2. **Access Application**: Open `http://localhost:8000`
3. **Edit Files**: Modify files in the `src/` directory
4. **Test Changes**: Refresh browser to see changes

### **File Organization Principles**
1. **Separation of Concerns**: HTML, CSS, and JS are separated
2. **Modular Structure**: Each page has its own JS file
3. **Configuration Centralization**: All config files in one directory
4. **Asset Organization**: Images and icons in dedicated directories
5. **Documentation**: All docs in a dedicated directory

### **Path Conventions**
- **Relative Paths**: All internal links use relative paths
- **Asset Paths**: Assets referenced from `src/assets/`
- **Page Navigation**: Pages in `src/pages/` directory
- **Script Imports**: JavaScript files in `src/js/` directory

## 🚀 Deployment Structure

### **Netlify Deployment**
- **Root Directory**: Contains `index.html` for main entry point
- **Build Command**: No build process needed (static site)
- **Publish Directory**: Root directory
- **Redirects**: Handled by `src/config/_redirects`

### **File Serving**
- **Static Files**: Served directly from file system
- **SPA Routing**: Handled by redirects configuration
- **PWA Features**: Service worker and manifest properly configured

## 📝 Code Organization

### **JavaScript Modules**
- **ES6 Modules**: All JS files use ES6 import/export
- **Firebase Integration**: Centralized in `firebase-config.js`
- **Authentication**: Handled by `auth.js` class
- **Page Logic**: Each page has its own JS file

### **CSS Organization**
- **Single Stylesheet**: All styles in `styles.css`
- **Component-based**: CSS organized by components
- **Responsive Design**: Mobile-first approach
- **UTA Branding**: Consistent with university visual identity

### **HTML Structure**
- **Semantic HTML**: Proper use of HTML5 semantic elements
- **Accessibility**: ARIA labels and proper form structure
- **SEO Optimization**: Meta tags and structured data
- **PWA Ready**: Manifest and service worker integration

## 🔍 Maintenance Guidelines

### **Adding New Features**
1. **Create HTML Page**: Add to `src/pages/`
2. **Add JavaScript**: Create corresponding JS file in `src/js/`
3. **Update Navigation**: Modify navigation in existing pages
4. **Test Functionality**: Ensure all features work correctly

### **Modifying Existing Features**
1. **Locate Files**: Find relevant files in the structure
2. **Make Changes**: Edit the appropriate files
3. **Test Changes**: Verify functionality still works
4. **Update Documentation**: Update relevant docs if needed

### **Asset Management**
1. **Add Images**: Place in `src/assets/images/`
2. **Add Icons**: Place in `src/assets/icons/`
3. **Optimize Files**: Compress images for web
4. **Update References**: Update HTML/CSS to reference new assets

This structure provides a clean, organized, and maintainable codebase that follows modern web development best practices.
