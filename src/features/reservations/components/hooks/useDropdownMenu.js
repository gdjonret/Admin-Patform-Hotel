import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing dropdown menu with smart positioning
 * @returns {Object} Menu state and handlers
 */
export function useDropdownMenu() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRefs = useRef({});
  const triggerRefs = useRef({});

  // Calculate menu position based on trigger button
  const calculatePosition = useCallback((triggerId) => {
    const trigger = triggerRefs.current[triggerId];
    if (!trigger) return { top: 0, left: 0 };

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 200;
    const spacing = 8;

    // Start with button's top position
    let top = rect.top;
    let left = rect.right + spacing;

    // Check if menu would go off right edge
    if (left + menuWidth > window.innerWidth) {
      left = rect.left - menuWidth - spacing;
    }

    // Get actual menu element to measure its height
    setTimeout(() => {
      const menu = menuRefs.current[triggerId];
      if (menu) {
        const menuRect = menu.getBoundingClientRect();
        const menuHeight = menuRect.height;
        
        // Check if menu goes off bottom edge
        if (menuRect.bottom > window.innerHeight - spacing) {
          // Reposition to fit in viewport
          const newTop = window.innerHeight - menuHeight - spacing;
          menu.style.top = `${Math.max(spacing, newTop)}px`;
        }
      }
    }, 10);

    return { top, left };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu !== null) {
        const menu = menuRefs.current[activeMenu];
        const trigger = triggerRefs.current[activeMenu];
        
        if (menu && !menu.contains(event.target) && 
            trigger && !trigger.contains(event.target)) {
          setActiveMenu(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && activeMenu !== null) {
        setActiveMenu(null);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [activeMenu]);

  const toggleMenu = useCallback((id, event) => {
    if (activeMenu === id) {
      setActiveMenu(null);
    } else {
      const position = calculatePosition(id);
      setMenuPosition(position);
      setActiveMenu(id);
    }
  }, [activeMenu, calculatePosition]);

  const closeMenu = useCallback(() => {
    setActiveMenu(null);
  }, []);

  const handleAction = useCallback(async (actionFn, actionName) => {
    setLoadingAction(actionName);
    try {
      await actionFn();
      closeMenu();
    } catch (error) {
      console.error(`Error executing ${actionName}:`, error);
    } finally {
      setLoadingAction(null);
    }
  }, [closeMenu]);

  const isActionLoading = useCallback((actionName) => {
    return loadingAction === actionName;
  }, [loadingAction]);

  return {
    activeMenu,
    menuRefs,
    triggerRefs,
    menuPosition,
    toggleMenu,
    closeMenu,
    handleAction,
    isActionLoading,
    loadingAction
  };
}
