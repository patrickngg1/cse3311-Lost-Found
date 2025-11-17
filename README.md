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

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+ modules)
- **Backend**: Firebase Authentication, Firestore Database
- **Storage**: Images stored as data URLs in Firestore
- **Hosting**: Netlify (static site hosting)
- **PWA**: Service worker for offline support and installability
- **Email**: EmailJS for notifications (optional)

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
├── index.html              # Main landing page with browse and submit
├── pages/
│   ├── login.html          # User login
│   ├── register.html       # User registration
│   ├── dashboard.html       # User dashboard
│   └── admin.html          # Admin dashboard
├── js/
│   ├── firebase-config.js  # Firebase initialization
│   ├── auth.js             # Authentication logic
│   ├── script.js           # Main app (submission, browse, search)
│   ├── dashboard.js        # User dashboard functionality
│   ├── admin.js            # Admin panel functionality
│   ├── item-matching.js    # Similar items matching algorithm
│   ├── email-notifications.js  # Email sending logic
│   ├── sw.js               # Service worker (PWA)
│   └── env.js              # Environment variables
├── styles.css              # All CSS styles
├── config/
│   ├── manifest.json       # PWA manifest
│   ├── netlify.toml        # Netlify deployment config
│   └── _redirects          # URL redirects
└── env.example             # Environment variables template
```

## Features

### For Users

**Item Submission**
- Submit lost or found items with detailed information
- Upload up to 4 photos per item
- Multi-step form with validation
- Auto-save drafts (restored if you leave and come back)
- Items are auto-approved and go live immediately

**Browse & Search**
- Browse all approved items in a grid view
- Real-time search across titles, descriptions, and details
- Filter by category (Electronics, Bags, ID Cards, etc.)
- Filter by type (Lost/Found)
- Pagination (12 items per page)

**Similar Items Matching**
When you submit a new item, the system automatically checks for similar items of the opposite type and notifies you if a potential match is found.

**How it works:**
- Runs automatically when you submit a LOST or FOUND item
- Compares your item against all items of the opposite type
- Uses a multi-factor scoring algorithm:
  - **Category match** (30%): Same category = higher match
  - **Keywords** (25%): Similar words in title/description
  - **Brand/Model** (20%): Exact or partial brand matches
  - **Color** (15%): Matching colors
  - **Location** (10%): Same or nearby locations
- Match threshold: 60% similarity required
- If a match is found (≥60%), you get an email notification with:
  - The potential match details
  - Match score percentage
  - Reasons why it matched
  - Link to view the item

**Example:** You report a "Black iPhone 13 Pro" as lost. Someone else reported finding a "Black iPhone 13 Pro" at the same location. The system detects 85% similarity and sends you both an email notification.

**Dashboard**
- View all your submitted items
- See statistics (total items, lost, found, pending, claimed)
- Filter and search your items
- Contact other users about their items
- Claim found items

**Contact & Claim**
- Contact item owners directly through the platform
- Claim found items with verification details
- Email notifications sent to both parties

### For Admins

**Admin Dashboard**
- View all items from all users (all statuses)
- Approve/reject items
- Hide items from public view
- Delete items (soft delete)
- View detailed statistics
- Export data to CSV
- Manage notification queue

**Moderation**
- Review pending items
- Approve items to make them public
- Reject items with notes
- Hide inappropriate items
- Full access to all item details

## Deployment

The app is hosted on Netlify. To deploy:

1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build:netlify` (or leave empty for static site)
3. Set publish directory: `/` (root)
4. Add environment variables in Netlify dashboard if needed

## Key Features Explained

### Authentication
- UTA email verification required (@mavs.uta.edu for students, @uta.edu for staff)
- Firebase Authentication handles user accounts
- Email verification required before login
- Password reset functionality

### Data Storage
- All items stored in Firebase Firestore `items` collection
- Images stored as data URLs (base64) - no separate storage bucket needed
- User data in `users` collection
- Notifications queued in `notifications` collection
- LocalStorage used as cache/offline backup

### Matching Algorithm Details
The matching system uses weighted scoring:
- **Category**: 30% weight - must match for high score
- **Keywords**: 25% weight - extracts meaningful words, ignores common words
- **Brand/Model**: 20% weight - exact match = 100%, partial = 70%
- **Colors**: 15% weight - any matching color = full points
- **Location**: 10% weight - exact = 100%, nearby = 50%

Only matches opposite types (LOST ↔ FOUND). Items with 60%+ similarity trigger notifications.

### Offline Support
- Service worker caches static assets
- Browse cached items when offline
- Submit items offline (queued for sync when online)
- Drafts saved to localStorage automatically

### Email Notifications
- Similar items found → automatic email
- Contact requests → email to item owner
- Claim requests → email to finder
- Uses EmailJS if configured, otherwise queued for admin to send

## License

MIT

---

Built for CSE 3311 at UTA
