import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Button component with loading state
 */
export default function ButtonWithLoading({ 
  children, 
  loading, 
  disabled, 
  onClick, 
  className = '',
  loadingText = 'Processing...',
  ...props 
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="small" color="currentColor" />
          <span style={{ marginLeft: '8px' }}>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
