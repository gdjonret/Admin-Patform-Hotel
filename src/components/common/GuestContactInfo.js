import React from 'react';

/**
 * Reusable component to display guest contact and address information
 * 
 * @param {Object} reservation - The reservation object containing guest details
 * @param {string} className - Optional CSS class for styling
 * @param {boolean} showContact - Whether to show contact section (default: true)
 * @param {boolean} showAddress - Whether to show address section (default: true)
 */
export default function GuestContactInfo({ 
  reservation, 
  className = '', 
  showContact = true, 
  showAddress = true 
}) {
  if (!reservation) return null;

  const hasContact = reservation.guestEmail || reservation.guestPhone;
  
  // Filter out empty/null values for display
  const addressParts = [
    reservation.city,
    reservation.zipCode,
    reservation.country
  ].filter(part => part && typeof part === 'string' && part.trim() !== '');

  return (
    <>
      {/* Contact Information */}
      {showContact && hasContact && (
        <div className={`info-section ${className}`}>
          {reservation.guestEmail && (
            <div className="info-group">
              <label className="info-label">Email</label>
              <div className="info-value">📧 {reservation.guestEmail}</div>
            </div>
          )}
          {reservation.guestPhone && (
            <div className="info-group">
              <label className="info-label">Phone</label>
              <div className="info-value">📱 {reservation.guestPhone}</div>
            </div>
          )}
        </div>
      )}
      
      {/* Address Information - Always show container */}
      {showAddress && (
        <div className={`info-section ${className}`}>
          <div className="info-group">
            <label className="info-label">Address</label>
            <div className="info-value">
              {addressParts.length > 0 ? (
                addressParts.join(", ")
              ) : (
                <span style={{ color: '#9ca3af' }}>—</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
