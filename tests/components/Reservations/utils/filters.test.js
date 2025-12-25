import { getFilteredReservations } from '../../../../src/components/Reservations/utils/filters';
import { isToday, isTomorrow, isFuture } from '../../../../src/lib/dates';

// Mock the date utility functions
jest.mock('../../../../src/lib/dates', () => ({
  isToday: jest.fn(),
  isTomorrow: jest.fn(),
  isFuture: jest.fn(),
}));

describe('getFilteredReservations', () => {
  // Sample reservation data for testing
  const mockReservations = [
    {
      id: '1',
      status: 'CONFIRMED',
      checkIn: '2025-09-21',
      checkOut: '2025-09-23',
      guestName: 'John Doe',
      roomType: 'Deluxe',
    },
    {
      id: '2',
      status: 'CHECKED_IN',
      checkIn: '2025-09-20',
      checkOut: '2025-09-22',
      guestName: 'Jane Smith',
      roomType: 'Standard',
    },
    {
      id: '3',
      status: 'CHECKED_OUT',
      checkIn: '2025-09-18',
      checkOut: '2025-09-20',
      guestName: 'Bob Johnson',
      roomType: 'Suite',
    },
    {
      id: '4',
      status: 'CONFIRMED',
      checkIn: '2025-09-25',
      checkOut: '2025-09-27',
      guestName: 'Alice Brown',
      roomType: 'Standard',
    },
  ];

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle null or undefined list', () => {
    expect(getFilteredReservations(null, { activeTab: 'all' })).toEqual([]);
    expect(getFilteredReservations(undefined, { activeTab: 'all' })).toEqual([]);
  });

  test('should return all reservations when activeTab is "all"', () => {
    const result = getFilteredReservations(mockReservations, { activeTab: 'all' });
    expect(result).toEqual(mockReservations);
  });

  test('should filter arrivals correctly', () => {
    // Setup mocks for date functions
    isToday.mockImplementation((date) => date === '2025-09-21');
    isTomorrow.mockImplementation((date) => date === '2025-09-22');

    const result = getFilteredReservations(mockReservations, { 
      activeTab: 'arrivals',
      today: '2025-09-21'
    });
    
    // Should only include CONFIRMED reservations with checkIn today or tomorrow
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('should filter in-house correctly', () => {
    const result = getFilteredReservations(mockReservations, { 
      activeTab: 'in-house',
      today: '2025-09-21'
    });
    
    // Should only include CHECKED_IN reservations
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  test('should filter departures correctly', () => {
    // Setup mocks for date functions
    isToday.mockImplementation((date) => date === '2025-09-22');

    const result = getFilteredReservations(mockReservations, { 
      activeTab: 'departures',
      today: '2025-09-22'
    });
    
    // Should only include CHECKED_IN reservations with checkOut today
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  test('should filter upcoming correctly', () => {
    // Setup mocks for date functions
    isToday.mockImplementation((date) => date === '2025-09-21');
    isTomorrow.mockImplementation((date) => date === '2025-09-22');
    isFuture.mockImplementation((date) => date === '2025-09-25');

    const result = getFilteredReservations(mockReservations, { 
      activeTab: 'upcoming',
      today: '2025-09-21'
    });
    
    // Should only include CONFIRMED reservations with checkIn in the future (not today or tomorrow)
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  test('should filter past correctly', () => {
    const result = getFilteredReservations(mockReservations, { 
      activeTab: 'past',
      today: '2025-09-21'
    });
    
    // Should only include CHECKED_OUT reservations
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  test('should apply search term filter correctly', () => {
    const result = getFilteredReservations(mockReservations, { 
      activeTab: 'all',
      searchTerm: 'John'
    });
    
    // Should only include reservations with "John" in the guest name
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('should apply status filter correctly', () => {
    const result = getFilteredReservations(mockReservations, { 
      activeTab: 'all',
      filterStatus: 'CONFIRMED'
    });
    
    // Should only include CONFIRMED reservations
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('4');
  });

  test('should apply both search term and status filters', () => {
    const result = getFilteredReservations(mockReservations, { 
      activeTab: 'all',
      searchTerm: 'Smith',
      filterStatus: 'CHECKED_IN'
    });
    
    // Should only include CHECKED_IN reservations with "Smith" in the guest name
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});
