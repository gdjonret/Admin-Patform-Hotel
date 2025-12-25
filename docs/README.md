# Hotel Reservation Admin Platform

A comprehensive administration platform for managing hotel reservations, rooms, guests, and generating reports.

## Features

- **Dashboard**: Overview of key metrics and recent activity
- **Reservations Management**: Create, view, edit, and manage all reservations
- **Room Management**: Monitor room status, availability, and details
- **Guest Management**: Track guest information and history
- **Reports**: Generate and export various reports for business insights
- **Settings**: Configure system preferences and business rules

## Technology Stack

- React.js 19.0.0
- React Router 7.3.0
- React Icons 5.5.0
- Axios for API requests
- CSS for styling (custom components)
- Tailwind CSS for utility classes

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd Admin-platform

# Install dependencies
npm install
```

### Running the Application

```bash
# Start the development server
npm start
```

This will launch the application in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Building for Production

```bash
# Build the application for production
npm run build
```

This creates an optimized production build in the `build` folder, ready for deployment.

## Deployment

This application is configured for deployment to AWS Elastic Beanstalk with the following setup:

- Docker container running Node.js and Nginx
- Health check endpoint at `/health`
- Static files served from `/usr/share/nginx/html`
- Port 80 for web traffic
- AWS Region: us-east-2
- Environment name: my-app-env

### Deployment Steps

1. Build the application using `npm run build`
2. Ensure AWS CLI is configured with appropriate credentials
3. Deploy using the AWS Elastic Beanstalk CLI or AWS Management Console

## Project Structure

```
├── public/                 # Public assets
├── src/                    # Source files
│   ├── components/         # Reusable components
│   │   ├── Navbar.js       # Top navigation bar
│   │   └── Sidebar.js      # Side navigation menu
│   ├── pages/              # Page components
│   │   ├── Dashboard.js    # Main dashboard
│   │   ├── Reservations.js # Reservations management
│   │   ├── Rooms.js        # Room management
│   │   ├── Guests.js       # Guest management
│   │   ├── Reports.js      # Reports generation
│   │   └── Settings.js     # System settings
│   ├── styles/             # CSS stylesheets
│   ├── App.js              # Main application component
│   └── index.js            # Application entry point
└── package.json            # Project dependencies

## Navigation

The application uses React Router for navigation with the following structure:

- `/` - Dashboard
- `/reservations` - Reservations management
- `/rooms` - Room management
- `/guests` - Guest management
- `/reports` - Reports generation
- `/settings` - System settings
- `/health` - Health check endpoint for AWS Elastic Beanstalk

## Backend Integration

The application is configured to connect with a backend API for data persistence. The connection is set up as follows:

- API base URL is configured in the `.env` file as `REACT_APP_API_URL`
- Default API URL is `http://localhost:3000/api`
- API services are located in the `src/api` directory
- Each entity has its own service file (e.g., `rooms.js`, `bookings.js`)
- Context providers are used to manage state and API interactions

### Testing Backend Integration

To test the backend integration:

1. Ensure your backend server is running
2. Run the test script: `./test-backend-integration.sh`
3. The script will check if the backend is accessible and start the React application

## Future Enhancements

- User authentication and role-based access control
- Integration with payment gateways
- Email notification system
- Mobile responsive design improvements
- Data visualization for reports
- Calendar view for reservations
- Offline mode with data synchronization

## License

This project is licensed under the MIT License - see the LICENSE file for details.
