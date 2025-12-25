# Project Structure

This document describes the reorganized folder structure of the Admin Platform.

## Overview

The project now follows a **feature-based architecture** where each feature has its own folder containing all related files (components, styles, hooks, utilities, etc.).

## Directory Structure

```
src/
├── api/                    # API service layer
│   ├── bookings.js
│   ├── dashboard.js
│   ├── guests.js
│   ├── http.js
│   ├── notifications.js
│   ├── reservations.js
│   ├── rooms.js
│   └── staff.js
│
├── components/             # Shared/common components
│   ├── common/            # Reusable UI components
│   ├── charts/            # Chart components + styles
│   ├── AdminOnly.js
│   ├── LoadingSpinner.js
│   ├── MenuPortal.js
│   ├── Navbar.js
│   ├── NotificationBell.js
│   ├── NotificationCenter.js
│   ├── ProtectedRoute.js
│   └── Sidebar.js
│
├── context/               # React context providers
│
├── features/              # Feature-based modules
│   ├── auth/             # Authentication feature
│   │   ├── Login.js
│   │   ├── Signup.js
│   │   ├── ForgotPassword.js
│   │   ├── auth.css
│   │   └── index.js
│   │
│   ├── dashboard/        # Dashboard feature
│   │   ├── components/   # Dashboard-specific components
│   │   │   ├── dashboard.css
│   │   │   ├── dashboard-minimal.css
│   │   │   └── dashboard.css.backup
│   │   ├── Dashboard.js
│   │   └── index.js
│   │
│   ├── reservations/     # Reservations feature
│   │   ├── components/   # Reservation components
│   │   │   ├── common/
│   │   │   ├── hooks/
│   │   │   ├── modals/
│   │   │   │   ├── assign-room-modal.css
│   │   │   │   ├── check-in-modal.css
│   │   │   │   ├── receipt-modal.css
│   │   │   │   └── view-modal.css
│   │   │   ├── utils/
│   │   │   ├── ReservationForm.js
│   │   │   ├── seedReservations.js
│   │   │   ├── reservations.css
│   │   │   ├── reservation-form.css
│   │   │   ├── reservation-statistic.css
│   │   │   └── modern-reservations-header.css
│   │   ├── Reservations.js
│   │   └── index.js
│   │
│   ├── rooms/            # Rooms feature
│   │   ├── components/
│   │   │   ├── RoomsWithProvider.js
│   │   │   ├── rooms.css
│   │   │   └── roomStyles.css
│   │   ├── Rooms.js
│   │   ├── RoomsWithTabs.js
│   │   └── index.js
│   │
│   ├── room-types/       # Room Types feature
│   │   ├── RoomTypes.js
│   │   └── index.js
│   │
│   ├── guests/           # Guests feature
│   │   ├── Guests.js
│   │   ├── guests.css
│   │   └── index.js
│   │
│   ├── staff/            # Staff feature
│   │   ├── Staff.js
│   │   ├── staff.css
│   │   └── index.js
│   │
│   ├── reports/          # Reports feature
│   │   ├── Reports.js
│   │   ├── reports.css
│   │   ├── reports-new.css
│   │   └── index.js
│   │
│   ├── helpdesk/         # Help Desk feature
│   │   ├── HelpDesk.js
│   │   ├── helpdesk.css
│   │   ├── helpdesk-sidebar.css
│   │   └── index.js
│   │
│   └── settings/         # Settings feature
│       ├── Settings.js
│       ├── settings.css
│       └── index.js
│
├── hooks/                # Custom React hooks
│   └── useRole.js
│
├── lib/                  # Utility libraries
│   ├── dates.js
│   ├── formatters.js
│   └── validators.js
│
├── routes/               # Application routing
│   └── AppRoutes.jsx
│
├── store/                # Redux store
│   ├── bookingsSlice.js
│   └── userSlice.js
│
├── styles/               # Global/shared styles
│   └── shared/
│       ├── navbar.css
│       ├── sidebar.css
│       ├── notifications.css
│       ├── modern-modal.css
│       ├── modern-form.css
│       ├── modern-table.css
│       ├── confirm-dialog.css
│       ├── status-badge.css
│       └── tabs.css
│
├── utils/                # Utility functions
│
├── App.jsx              # Main App component
├── App.css              # Global app styles
├── index.css            # Root styles
└── main.jsx             # Application entry point
```

## Feature Module Structure

Each feature module follows this pattern:

```
feature-name/
├── components/          # Feature-specific components
├── hooks/              # Feature-specific hooks (optional)
├── utils/              # Feature-specific utilities (optional)
├── FeatureName.js      # Main page component
├── feature-name.css    # Feature styles
└── index.js            # Barrel export file
```

## Import Patterns

### Importing from features:
```javascript
// Named imports from feature index
import { Dashboard } from '../features/dashboard';
import { Login, Signup } from '../features/auth';

// Direct component imports
import Reservations from '../features/reservations/Reservations';
```

### Importing shared components:
```javascript
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
```

### Importing utilities:
```javascript
import { formatDate } from '../lib/dates';
import { validateEmail } from '../lib/validators';
```

## Benefits of This Structure

1. **Feature Isolation**: Each feature is self-contained with all its related files
2. **Easier Navigation**: Find all files related to a feature in one place
3. **Better Scalability**: Easy to add new features without cluttering the root
4. **Clearer Dependencies**: Feature-specific code stays within the feature folder
5. **Simplified Imports**: Barrel exports (index.js) provide clean import paths
6. **Improved Maintainability**: Changes to a feature are localized to its folder

## Migration Notes

- Old `/pages` folder has been removed
- Page components moved to `/features/{feature-name}/{FeatureName}.js`
- Feature-specific styles moved alongside their components
- Shared/global styles remain in `/styles/shared`
- Old/backup files moved to `/old-files` directory
