import React from 'react';
import PropTypes from 'prop-types';
import { MdSearchOff, MdAddCircleOutline } from 'react-icons/md';
import Button from './Button';

/**
 * EmptyState component for displaying when no data is available
 * Used in tables, lists, and search results throughout the Reservations section
 */
const EmptyState = ({
  title = 'No results found',
  message = 'We couldn\'t find any items matching your criteria.',
  icon: CustomIcon,
  actionText,
  onAction,
  variant = 'default',
  className = '',
}) => {
  // Determine which icon to use
  const Icon = CustomIcon || (variant === 'add' ? MdAddCircleOutline : MdSearchOff);
  
  // Determine background color based on variant
  const bgColor = variant === 'compact' ? 'bg-transparent' : 'bg-gray-50';
  
  // Determine padding based on variant
  const padding = variant === 'compact' ? 'py-4' : 'py-12';
  
  return (
    <div className={`w-full ${bgColor} ${padding} rounded-lg flex flex-col items-center justify-center text-center ${className}`}>
      <div className="text-gray-400 mb-3">
        <Icon size={variant === 'compact' ? 32 : 48} />
      </div>
      
      <h3 className="text-lg font-medium text-gray-700 mb-1">{title}</h3>
      
      <p className="text-sm text-gray-500 max-w-md mb-4">{message}</p>
      
      {actionText && onAction && (
        <Button 
          variant="primary" 
          size={variant === 'compact' ? 'small' : 'medium'}
          onClick={onAction}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  icon: PropTypes.elementType,
  actionText: PropTypes.string,
  onAction: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'compact', 'add']),
  className: PropTypes.string,
};

export default EmptyState;
