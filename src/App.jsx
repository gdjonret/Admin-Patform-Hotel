import './App.css';
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AppRoutes from "./routes/AppRoutes";
import { RoomProvider } from "./context/RoomContext";
import { AuthProvider } from "./context/AuthContext";
import { MessagesProvider } from "./context/MessagesContext";

/**
 * Layout wrapper that conditionally shows navbar/sidebar
 */
function AppLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password';

  if (isAuthPage) {
    // Auth pages - no layout
    return <AppRoutes />;
  }

  // Regular pages - with layout
  return (
    <div className="app-container">
      <Navbar />
      <Sidebar />
      <main className="main-content">
        <AppRoutes />
      </main>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

/**
 * Main application component
 * Provides the layout structure and routing for the admin platform
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <RoomProvider>
          <MessagesProvider>
            <AppLayout />
          </MessagesProvider>
        </RoomProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
