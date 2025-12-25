import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * MenuPortal component for rendering dropdown menus in a portal
 * This ensures menus are always visible regardless of container overflow settings
 */
const MenuPortal = ({ children, isOpen, buttonRef, activeId }) => {
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  
  useEffect(() => {
    // Find the active menu button
    if (isOpen && activeId && buttonRef.current[activeId]) {
      const activeButton = buttonRef.current[activeId];
      
      if (activeButton) {
        const rect = activeButton.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Calculate if there's enough space below
        const spaceBelow = viewportHeight - rect.bottom;
        const menuHeight = 120; // Approximate height of menu
        const menuWidth = 120; // Approximate width of menu
        
        // Position the menu relative to the button
        // For action menus, we need to position it to the left of the button
        const leftPosition = rect.left - menuWidth + 20;
        
        if (spaceBelow < menuHeight) {
          // Position above the button
          setMenuPosition({
            top: rect.top - menuHeight - 5,
            left: leftPosition
          });
        } else {
          // Position below the button
          setMenuPosition({
            top: rect.bottom + 5,
            left: leftPosition
          });
        }
      }
    }
  }, [isOpen, buttonRef, activeId]);
  
  if (!isOpen) return null;
  
  return createPortal(
    <div 
      className="action-menu-portal"
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
        zIndex: 9999
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default MenuPortal;
