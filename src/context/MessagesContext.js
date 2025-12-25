import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/admin';

const MessagesContext = createContext({
  unreadCount: 0,
  newCount: 0,
  refreshUnreadCount: () => {}
});

export const MessagesProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [newCount, setNewCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUnreadCount(0);
        setNewCount(0);
        return;
      }

      const response = await fetch(`${API_URL}/contact-messages/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      setUnreadCount(data.unread ?? 0);
      setNewCount(data.new ?? 0);
    } catch (error) {
      console.error('Error fetching message counts:', error);
      setUnreadCount(0);
      setNewCount(0);
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();

    const intervalId = setInterval(() => {
      refreshUnreadCount();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
  }, [refreshUnreadCount]);

  return (
    <MessagesContext.Provider value={{ unreadCount, newCount, refreshUnreadCount }}>
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessagesContext = () => useContext(MessagesContext);
