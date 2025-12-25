import React from 'react';

/**
 * Loading spinner component
 * Used for suspense fallback and loading states
 */
function LoadingSpinner({ size = 'medium', color = 'primary' }) {
  // Size classes
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  };
  
  // Color classes
  const colorClasses = {
    primary: 'border-blue-500',
    secondary: 'border-gray-500',
    success: 'border-green-500',
    danger: 'border-red-500'
  };
  
  const spinnerSize = sizeClasses[size] || sizeClasses.medium;
  const spinnerColor = colorClasses[color] || colorClasses.primary;
  
  return (
    <div className="flex items-center justify-center">
      <div 
        className={`${spinnerSize} ${spinnerColor} border-t-transparent rounded-full animate-spin`}
        role="status" 
        aria-label="Loading"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default LoadingSpinner;
