# Modern Modal CSS - Usage Guide

## Overview
The `modern-modal.css` file provides reusable, consistent styling for modals across the application.

## Quick Start

### 1. Import the CSS
```javascript
import '../styles/modern-modal.css';
```

### 2. Basic Modal Structure
```jsx
{createPortal(
  <div className="modern-modal-overlay">
    <div className="modern-modal-container">
      {/* Header */}
      <div className="modern-modal-header">
        <h2>Modal Title</h2>
        <p>Optional subtitle or description</p>
      </div>

      {/* Body */}
      <div className="modern-modal-body">
        {/* Your content here */}
      </div>

      {/* Footer */}
      <div className="modern-modal-footer">
        <button className="modern-modal-btn-secondary">Cancel</button>
        <button className="modern-modal-btn-primary">Save</button>
      </div>
    </div>
  </div>,
  document.body
)}
```

## Available Classes

### Container Sizes
- `modern-modal-container` - Default (600px max-width)
- `modern-modal-container large` - Large (800px max-width)
- `modern-modal-container small` - Small (400px max-width)

### Form Elements
```jsx
<div className="modern-form-group">
  <label>Field Label</label>
  <input type="text" placeholder="Enter value" />
</div>
```

### Buttons
- `modern-modal-btn-secondary` - Cancel/Close buttons (white with border)
- `modern-modal-btn-primary` - Save/Submit buttons (dark gradient)

### Status Messages
```jsx
<div className="modern-modal-status">Info message</div>
<div className="modern-modal-status error">Error message</div>
<div className="modern-modal-status success">Success message</div>
```

### View Details
```jsx
<div className="modern-view-details">
  <div className="modern-detail-row">
    <span className="modern-detail-label">Label:</span>
    <span className="modern-detail-value">Value</span>
  </div>
</div>
```

## Example: Edit Modal

```jsx
{createPortal(
  <div className="modern-modal-overlay">
    <div className="modern-modal-container">
      <div className="modern-modal-header">
        <h2>Edit Item</h2>
        <p>Update item information</p>
      </div>

      <div className="modern-modal-body">
        <div className="modern-form-group">
          <label>Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="modern-form-group">
          <label>Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="modern-modal-footer">
        {statusMessage && (
          <div className="modern-modal-status">{statusMessage}</div>
        )}
        <button 
          className="modern-modal-btn-secondary"
          onClick={closeModal}
        >
          Cancel
        </button>
        <button 
          className="modern-modal-btn-primary"
          onClick={saveChanges}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : '✓ Save Changes'}
        </button>
      </div>
    </div>
  </div>,
  document.body
)}
```

## Example: View Modal

```jsx
{createPortal(
  <div className="modern-modal-overlay">
    <div className="modern-modal-container">
      <div className="modern-modal-header">
        <h2>View Details</h2>
        <p>Item information</p>
      </div>

      <div className="modern-modal-body">
        <div className="modern-view-details">
          <div className="modern-detail-row">
            <span className="modern-detail-label">Name:</span>
            <span className="modern-detail-value">{item.name}</span>
          </div>
          <div className="modern-detail-row">
            <span className="modern-detail-label">Price:</span>
            <span className="modern-detail-value price">{item.price} FCFA</span>
          </div>
          <div className="modern-detail-row">
            <span className="modern-detail-label">Status:</span>
            <span className="modern-detail-value">
              <span className={`status-badge ${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="modern-modal-footer">
        <button 
          className="modern-modal-btn-secondary"
          onClick={closeModal}
        >
          Close
        </button>
        <button 
          className="modern-modal-btn-primary"
          onClick={() => setMode('edit')}
        >
          Edit
        </button>
      </div>
    </div>
  </div>,
  document.body
)}
```

## Features

✅ **Consistent Design** - All modals look the same
✅ **Responsive** - Mobile-friendly breakpoints
✅ **Accessible** - Proper focus states and ARIA attributes
✅ **Easy to Use** - Simple class names
✅ **Customizable** - Override with additional classes if needed
✅ **Portal Support** - Designed to work with React portals

## Files Using This CSS
- `/src/pages/Rooms.js` - Add, Edit, View room modals
- Can be used in: Guests, Staff, RoomTypes, and any other page with modals

## Customization
To customize colors or spacing, edit `/src/styles/modern-modal.css` and all modals will update automatically.
