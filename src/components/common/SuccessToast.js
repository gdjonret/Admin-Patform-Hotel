import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function SuccessToast({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return createPortal(
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#10b981',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      zIndex: 9999,
      animation: 'slideInRight 0.3s ease'
    }}>
      <span style={{ fontSize: '20px' }}>✓</span>
      <span style={{ fontWeight: '500' }}>{message}</span>
    </div>,
    document.body
  );
}
