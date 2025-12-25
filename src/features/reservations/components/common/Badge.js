import React from 'react';
import PropTypes from 'prop-types';

/**
 * Badge component for displaying status indicators
 * Used throughout the Reservations section for showing reservation statuses
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'medium',
  rounded = false,
  icon,
  className = '',
  ...props
}) => {
  // Variant styles (background, text color)
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-cyan-100 text-cyan-800',
    
    // Status-specific variants
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    'checked-in': 'bg-blue-100 text-blue-800',
    'checked-out': 'bg-gray-100 text-gray-800',
    
    // Payment status variants
    paid: 'bg-green-100 text-green-800',
    unpaid: 'bg-red-100 text-red-800',
    partial: 'bg-yellow-100 text-yellow-800',
  };
  
  // Size styles
  const sizeStyles = {
    small: 'text-xs px-1.5 py-0.5',
    medium: 'text-xs px-2 py-1',
    large: 'text-sm px-2.5 py-1.5',
  };
  
  // Border radius
  const roundedStyle = rounded ? 'rounded-full' : 'rounded';
  
  // Get the appropriate styles
  const badgeVariant = variantStyles[variant] || variantStyles.default;
  const badgeSize = sizeStyles[size] || sizeStyles.medium;
  
  return (
    <span 
      className={`inline-flex items-center font-medium ${badgeVariant} ${badgeSize} ${roundedStyle} ${className}`}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'default', 'primary', 'success', 'warning', 'danger', 'info',
    'pending', 'confirmed', 'cancelled', 'checked-in', 'checked-out',
    'paid', 'unpaid', 'partial'
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  rounded: PropTypes.bool,
  icon: PropTypes.node,
  className: PropTypes.string,
};

export default Badge;
