import React from "react";
import '../../features/reservations/components/modals/check-in-modal.css';

/**
 * Reusable Time Input Component (Hours and Minutes)
 * @param {string} hours - Hours value
 * @param {string} minutes - Minutes value
 * @param {function} onHoursChange - Handler for hours change
 * @param {function} onMinutesChange - Handler for minutes change
 * @param {string} label - Label text (e.g., "Check-In Time (24h format)")
 * @param {string} hint - Hint text (e.g., "Standard check-in time: 15:00 (3:00 PM)")
 */
export default function TimeInput({ 
  hours, 
  minutes, 
  onHoursChange, 
  onMinutesChange, 
  label = "Time (24h format)",
  hint = ""
}) {
  const handleHoursChange = (e) => {
    const value = e.target.value;
    
    if (value === '' || /^\d+$/.test(value)) {
      if (value.length <= 2 && parseInt(value || '0', 10) <= 23) {
        onHoursChange(value);
        
        if (value.length === 2) {
          document.getElementById('minutes-input')?.focus();
        }
      }
    }
  };
  
  const handleMinutesChange = (e) => {
    const value = e.target.value;
    
    if (value === '' || /^\d+$/.test(value)) {
      if (value.length <= 2 && parseInt(value || '0', 10) <= 59) {
        onMinutesChange(value);
      }
    }
  };

  return (
    <div className="time-input-wrapper">
      <label className="time-label-main">{label}</label>
      <div className="time-inputs-container">
        <div className="time-input-group">
          <input
            id="hours-input"
            className="input time-input hours"
            type="text"
            inputMode="numeric"
            placeholder="HH"
            value={hours}
            onChange={handleHoursChange}
            maxLength={2}
            required
          />
          <label className="time-label">heures</label>
        </div>
        <div className="time-separator">:</div>
        <div className="time-input-group">
          <input
            id="minutes-input"
            className="input time-input minutes"
            type="text"
            inputMode="numeric"
            placeholder="MM"
            value={minutes}
            onChange={handleMinutesChange}
            maxLength={2}
            required
          />
          <label className="time-label">minutes</label>
        </div>
      </div>
      {hint && <p className="time-hint">{hint}</p>}
    </div>
  );
}
