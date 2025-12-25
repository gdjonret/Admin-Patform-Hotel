/**
 * Simple Event Bus for cross-component communication
 * Allows pages to emit and listen to events without direct coupling
 */

class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {function} callback - Function to call when event is emitted
   * @returns {function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Data to pass to listeners
   */
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  off(event) {
    delete this.events[event];
  }
}

// Create singleton instance
const eventBus = new EventBus();

export default eventBus;

// Event names (for consistency)
export const EVENTS = {
  GUEST_UPDATED: 'guest-updated',
  BOOKING_UPDATED: 'booking-updated',
  ROOM_UPDATED: 'room-updated',
  ROOM_ASSIGNED: 'room-assigned',
  ROOM_TYPE_CREATED: 'room-type-created',
  ROOM_TYPE_UPDATED: 'room-type-updated',
  ROOM_TYPE_DELETED: 'room-type-deleted',
  PAYMENT_RECORDED: 'payment-recorded',
  GUEST_CHECKED_IN: 'guest-checked-in',
  GUEST_CHECKED_OUT: 'guest-checked-out'
};
