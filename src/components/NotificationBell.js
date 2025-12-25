import React, { useState, useEffect } from "react";
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

const API = "http://localhost:5000";

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);


  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  
  useEffect(() => {
    // Initialize EventSource for real-time notifications
    const es = new EventSource(`${API}/api/notifications/stream`, { withCredentials: true });

    es.addEventListener("BOOKING_CREATED", (evt) => {
      const notification = JSON.parse(evt.data);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(count => count + 1);
      // Could add toast notification here
    });

    es.addEventListener("BOOKING_UPDATED", (evt) => {
      const notification = JSON.parse(evt.data);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(count => count + 1);
      // Could add toast notification here
    });

    es.addEventListener("BOOKING_CANCELLED", (evt) => {
      const notification = JSON.parse(evt.data);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(count => count + 1);
      // Could add toast notification here
    });

    // Handle connection errors
    es.onerror = (error) => {
      console.error('EventSource failed:', error);
      es.close();
    };

    // Clean up on component unmount
    return () => {
      es.close();
    };
  }, []);
  
  // Mark all notifications as read when opening the menu
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setUnreadCount(0);
  };

  return (
    <>
      <IconButton 
        onClick={handleClick}
        size="medium"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'notification-button',
          sx: { width: 320, padding: 0 }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        disableScrollLock
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
        </Box>
        <Divider />
        
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2">No new notifications</Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem key={notification.id} onClick={handleClose}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight="bold">
                    {notification.type}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.date}
                  </Typography>
                </Box>
                <Typography variant="body2">{notification.user}</Typography>
              </Box>
            </MenuItem>
          ))
        )}
        
        {notifications.length > 0 && (
          <>
            <Divider />
            <MenuItem onClick={handleClose} sx={{ justifyContent: 'center' }}>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                View All Notifications
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}
