import React from 'react';
import { MdMoreVert } from 'react-icons/md';
import './ActionMenuButton.css';

const ActionMenuButton = ({ onClick, buttonRef, isActive, ariaLabel = "Actions" }) => {
  return (
    <button 
      onClick={onClick}
      ref={buttonRef}
      className="action-menu-button"
      aria-label={ariaLabel}
      aria-expanded={isActive}
      aria-haspopup="menu"
    >
      <MdMoreVert />
    </button>
  );
};

export default ActionMenuButton;
