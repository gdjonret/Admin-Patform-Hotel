import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card component for displaying content in a contained box
 * Used throughout the Reservations section for grouping related information
 */
const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  variant = 'default',
  className = '',
  ...props
}) => {
  // Determine card styles based on variant
  const cardStyles = {
    default: 'bg-white border border-gray-200 shadow-sm',
    flat: 'bg-white border border-gray-200',
    elevated: 'bg-white border border-gray-200 shadow-md',
    outlined: 'bg-white border border-gray-300',
    none: '',
  };
  
  // Get the appropriate style
  const cardStyle = cardStyles[variant] || cardStyles.default;
  
  return (
    <div 
      className={`rounded-lg overflow-hidden ${cardStyle} ${className}`}
      {...props}
    >
      {/* Card Header */}
      {(title || headerAction) && (
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            {title && <h3 className="font-medium text-gray-800">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && (
            <div className="ml-4">{headerAction}</div>
          )}
        </div>
      )}
      
      {/* Card Body */}
      <div className="p-4">
        {children}
      </div>
      
      {/* Card Footer */}
      {footer && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  headerAction: PropTypes.node,
  footer: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'flat', 'elevated', 'outlined', 'none']),
  className: PropTypes.string,
};

export default Card;
