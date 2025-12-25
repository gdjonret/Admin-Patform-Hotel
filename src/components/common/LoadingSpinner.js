// src/components/common/LoadingSpinner.js
import React from 'react';

/**
 * Reusable loading spinner component
 * 
 * Usage:
 * <LoadingSpinner size="small" />
 * <LoadingSpinner size="medium" color="#3b82f6" />
 */
export default function LoadingSpinner({ 
  size = 'medium', 
  color = '#3b82f6',
  className = '' 
}) {
  const sizes = {
    small: 16,
    medium: 24,
    large: 40
  };
  
  const spinnerSize = sizes[size] || sizes.medium;
  
  return (
    <div 
      className={`loading-spinner ${className}`}
      style={{
        display: 'inline-block',
        width: spinnerSize,
        height: spinnerSize
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: 'spin 1s linear infinite',
          width: '100%',
          height: '100%'
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60"
          strokeDashoffset="15"
          opacity="0.25"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60"
          strokeDashoffset="15"
        />
      </svg>
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
