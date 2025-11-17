# UTA Lost & Found

A web app for UTA students and staff to report and find lost items on campus.

## What it does

- Report lost or found items with photos and details
- Browse and search all items
- Automatic matching between lost and found items
- Contact item owners directly
- Personal dashboard to manage your submissions
- Admin panel for moderation

## Tech stack

- HTML/CSS/JavaScript (no frameworks)
- Firebase (Auth, Firestore, Storage)
- Netlify for hosting
- PWA support (works offline, installable)

## Getting started

### Prerequisites

- A UTA email (@mavs.uta.edu or @uta.edu)
- Modern web browser

### Local setup

1. Clone the repo:
```bash
git clone https://github.com/your-username/cse3311-Lost-Found.git
cd cse3311-Lost-Found
```

2. Set up Firebase:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password) and Firestore
   - Copy your Firebase config
   - Create `js/firebase-config.js` with your config (see `js/firebase-config.js.example` if it exists)

3. Start a local server:
```bash
npm start
# or
python3 -m http.server 8000
```

4. Open `http://localhost:8000` in your browser

## Project structure

```
├── index.html          # Main page
├── pages/              # Login, register, dashboard, admin
├── js/                 # All JavaScript files
│   ├── firebase-config.js
│   ├── auth.js
│   ├── script.js       # Main app logic
│   ├── dashboard.js
│   └── admin.js
├── styles.css          # All styles
└── config/             # PWA manifest, Netlify config
```

## Features

**For users:**
- Submit lost/found items with photos
- Search and filter items
- Get notified when similar items are found
- Contact item owners
- Claim found items

**For admins:**
- Approve/reject items
- View all submissions
- Manage users
- Export data

## Deployment

The app is hosted on Netlify. To deploy:

1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build:netlify` (or leave empty for static site)
3. Set publish directory: `/` (root)
4. Add environment variables in Netlify dashboard if needed

## Development notes

- All data is stored in Firebase Firestore
- Images are stored as data URLs in Firestore (no Firebase Storage needed)
- Email notifications use EmailJS (optional)
- Service worker handles offline functionality

## License

MIT

---

Built for CSE 3311 at UTA
