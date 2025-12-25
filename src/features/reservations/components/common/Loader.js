import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loader component for displaying loading states
 * Used throughout the Reservations section for async operations
 */
const Loader = ({
  size = 'medium',
  color = 'primary',
  variant = 'spinner',
  text = 'Loading...',
  fullPage = false,
  transparent = false,
  className = '',
}) => {
  // Size classes for spinner
  const spinnerSizes = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4',
  };
  
  // Color classes
  const spinnerColors = {
    primary: 'border-blue-600',
    secondary: 'border-gray-600',
    white: 'border-white',
  };
  
  // Text size classes
  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };
  
  // Get the appropriate classes
  const spinnerSize = spinnerSizes[size] || spinnerSizes.medium;
  const spinnerColor = spinnerColors[color] || spinnerColors.primary;
  const textSize = textSizes[size] || textSizes.medium;
  
  // Container classes for full page or inline
  const containerClasses = fullPage
    ? `fixed inset-0 flex items-center justify-center z-50 ${transparent ? 'bg-white bg-opacity-75' : 'bg-white'}`
    : 'flex flex-col items-center justify-center';
  
  // Render spinner variant
  const renderSpinner = () => (
    <div 
      className={`${spinnerSize} ${spinnerColor} rounded-full border-t-transparent animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
  
  // Render dots variant
  const renderDots = () => (
    <div className="flex space-x-1" role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div 
          key={i}
          className={`${color === 'white' ? 'bg-white' : 'bg-blue-600'} rounded-full ${size === 'small' ? 'w-1 h-1' : size === 'large' ? 'w-3 h-3' : 'w-2 h-2'}`}
          style={{
            animation: `pulse 1.5s infinite ease-in-out ${i * 0.2}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(0.75); opacity: 0.5; }
          50% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
  
  return (
    <div className={containerClasses}>
      {variant === 'spinner' ? renderSpinner() : renderDots()}
      {text && <p className={`mt-2 ${textSize} ${color === 'white' ? 'text-white' : 'text-gray-600'}`}>{text}</p>}
    </div>
  );
};

Loader.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'white']),
  variant: PropTypes.oneOf(['spinner', 'dots']),
  text: PropTypes.string,
  fullPage: PropTypes.bool,
  transparent: PropTypes.bool,
  className: PropTypes.string,
};

export default Loader;
