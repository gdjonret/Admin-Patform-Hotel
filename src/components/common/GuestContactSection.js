import React from 'react';

/**
 * Reusable component to display guest contact and address in section format
 * (for ViewReservationModal style)
 * 
 * @param {Object} reservation - The reservation object containing guest details
 * @param {string} email - Email address
 * @param {string} phone - Phone number
 */
export default function GuestContactSection({ reservation, email, phone }) {
  if (!reservation && !email && !phone) return null;

  const guestEmail = email || reservation?.guestEmail;
  const guestPhone = phone || reservation?.guestPhone;
  
  // Only use city, zipCode, country
  const addressParts = [reservation?.city, reservation?.zipCode, reservation?.country]
    .filter(p => p && p.trim());

  return (
    <>
      {/* Address Information - Always show container */}
      <div className="section">
        <h2>Address</h2>
        <p className="muted">
          {addressParts.length > 0 ? (
            addressParts.map((part, i) => (
              <React.Fragment key={i}>
                {part}
                {i < addressParts.length - 1 && <br />}
              </React.Fragment>
            ))
          ) : (
            <span style={{ color: '#9ca3af' }}>—</span>
          )}
        </p>
      </div>
    </>
  );
}
