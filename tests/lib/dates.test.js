import {
  toYmd,
  parseYmd,
  addDaysYmd,
  cmpYmd,
  isBeforeYmd,
  isAfterYmd,
  isSameDayYmd,
  nightsBetweenYmd,
  isToday,
  isTomorrow,
  isFuture,
  formatYMD,
  validateStay
} from '../../src/lib/dates';

// Mock the current date for consistent testing
const mockDate = new Date('2025-09-21T12:00:00Z');
const originalDate = global.Date;

describe('Date Utility Functions', () => {
  beforeAll(() => {
    // Mock Date constructor to return a fixed date
    global.Date = class extends Date {
      constructor(...args) {
        return args.length ? new originalDate(...args) : mockDate;
      }
    };
    // Ensure static methods are also available
    global.Date.now = () => mockDate.getTime();
  });

  afterAll(() => {
    // Restore original Date
    global.Date = originalDate;
  });

  describe('toYmd', () => {
    test('should format current date as YYYY-MM-DD when no argument is provided', () => {
      expect(toYmd()).toBe('2025-09-21');
    });

    test('should format a given date as YYYY-MM-DD', () => {
      const date = new Date('2025-10-15');
      expect(toYmd(date)).toBe('2025-10-15');
    });

    test('should handle single-digit month and day', () => {
      const date = new Date('2025-01-05');
      expect(toYmd(date)).toBe('2025-01-05');
    });
  });

  describe('parseYmd', () => {
    test('should parse a YYYY-MM-DD string into a Date object at local midnight', () => {
      const result = parseYmd('2025-09-21');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(8); // 0-indexed, so September is 8
      expect(result.getDate()).toBe(21);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    test('should return null for invalid input', () => {
      expect(parseYmd()).toBeNull();
      expect(parseYmd(null)).toBeNull();
      expect(parseYmd('')).toBeNull();
    });

    test('should handle incomplete dates by defaulting to first day/month', () => {
      const result1 = parseYmd('2025-09');
      expect(result1.getFullYear()).toBe(2025);
      expect(result1.getMonth()).toBe(8);
      expect(result1.getDate()).toBe(1);

      const result2 = parseYmd('2025');
      expect(result2.getFullYear()).toBe(2025);
      expect(result2.getMonth()).toBe(0); // January
      expect(result2.getDate()).toBe(1);
    });
  });

  describe('addDaysYmd', () => {
    test('should add days to a date string and return a new date string', () => {
      expect(addDaysYmd('2025-09-21', 1)).toBe('2025-09-22');
      expect(addDaysYmd('2025-09-21', 10)).toBe('2025-10-01');
      expect(addDaysYmd('2025-09-21', -1)).toBe('2025-09-20');
    });

    test('should handle month and year boundaries', () => {
      expect(addDaysYmd('2025-09-30', 1)).toBe('2025-10-01');
      expect(addDaysYmd('2025-12-31', 1)).toBe('2026-01-01');
      expect(addDaysYmd('2025-01-01', -1)).toBe('2024-12-31');
    });

    test('should handle leap years', () => {
      expect(addDaysYmd('2024-02-28', 1)).toBe('2024-02-29');
      expect(addDaysYmd('2024-02-29', 1)).toBe('2024-03-01');
      expect(addDaysYmd('2025-02-28', 1)).toBe('2025-03-01'); // 2025 is not a leap year
    });
  });

  describe('cmpYmd, isBeforeYmd, isAfterYmd, isSameDayYmd', () => {
    test('cmpYmd should compare dates correctly', () => {
      expect(cmpYmd('2025-09-21', '2025-09-21')).toBe(0);
      expect(cmpYmd('2025-09-20', '2025-09-21')).toBe(-1);
      expect(cmpYmd('2025-09-22', '2025-09-21')).toBe(1);
    });

    test('isBeforeYmd should check if a date is before another', () => {
      expect(isBeforeYmd('2025-09-20', '2025-09-21')).toBe(true);
      expect(isBeforeYmd('2025-09-21', '2025-09-21')).toBe(false);
      expect(isBeforeYmd('2025-09-22', '2025-09-21')).toBe(false);
    });

    test('isAfterYmd should check if a date is after another', () => {
      expect(isAfterYmd('2025-09-22', '2025-09-21')).toBe(true);
      expect(isAfterYmd('2025-09-21', '2025-09-21')).toBe(false);
      expect(isAfterYmd('2025-09-20', '2025-09-21')).toBe(false);
    });

    test('isSameDayYmd should check if two dates are the same', () => {
      expect(isSameDayYmd('2025-09-21', '2025-09-21')).toBe(true);
      expect(isSameDayYmd('2025-09-20', '2025-09-21')).toBe(false);
      expect(isSameDayYmd('2025-09-22', '2025-09-21')).toBe(false);
    });
  });

  describe('nightsBetweenYmd', () => {
    test('should calculate the number of nights between two dates', () => {
      expect(nightsBetweenYmd('2025-09-21', '2025-09-22')).toBe(1);
      expect(nightsBetweenYmd('2025-09-21', '2025-09-25')).toBe(4);
    });

    test('should return 0 for invalid inputs', () => {
      expect(nightsBetweenYmd(null, '2025-09-22')).toBe(0);
      expect(nightsBetweenYmd('2025-09-21', null)).toBe(0);
      expect(nightsBetweenYmd('', '')).toBe(0);
    });

    test('should return 0 for same day or reverse order', () => {
      expect(nightsBetweenYmd('2025-09-21', '2025-09-21')).toBe(0);
      expect(nightsBetweenYmd('2025-09-22', '2025-09-21')).toBe(0); // Check-out before check-in
    });
  });

  describe('isToday, isTomorrow, isFuture', () => {
    test('isToday should identify if a date is today', () => {
      expect(isToday('2025-09-21')).toBe(true);
      expect(isToday('2025-09-20')).toBe(false);
      expect(isToday('2025-09-22')).toBe(false);
    });

    test('isTomorrow should identify if a date is tomorrow', () => {
      expect(isTomorrow('2025-09-22')).toBe(true);
      expect(isTomorrow('2025-09-21')).toBe(false);
      expect(isTomorrow('2025-09-23')).toBe(false);
    });

    test('isFuture should identify if a date is in the future', () => {
      expect(isFuture('2025-09-22')).toBe(true);
      expect(isFuture('2025-09-21')).toBe(false); // Today is not considered future
      expect(isFuture('2025-09-20')).toBe(false);
    });

    test('these functions should accept a custom reference date', () => {
      expect(isToday('2025-09-25', '2025-09-25')).toBe(true);
      expect(isTomorrow('2025-09-26', '2025-09-25')).toBe(true);
      expect(isFuture('2025-09-27', '2025-09-25')).toBe(true);
    });
  });

  describe('formatYMD', () => {
    test('should format a Date object to YYYY-MM-DD', () => {
      const date = new Date('2025-09-21');
      expect(formatYMD(date)).toBe('2025-09-21');
    });

    test('should return an existing YYYY-MM-DD string as is', () => {
      expect(formatYMD('2025-09-21')).toBe('2025-09-21');
    });

    test('should convert other date strings to YYYY-MM-DD', () => {
      expect(formatYMD('September 21, 2025')).toBe('2025-09-21');
    });

    test('should handle invalid inputs gracefully', () => {
      expect(formatYMD('')).toBe('');
      expect(formatYMD(null)).toBe('');
      expect(formatYMD('not a date')).toBe('');
    });
  });

  describe('validateStay', () => {
    test('should validate a valid stay', () => {
      const result = validateStay({
        checkInDate: '2025-09-22', // Tomorrow
        checkOutDate: '2025-09-25',
        checkInTime: '15:00',
        checkOutTime: '11:00',
      });
      expect(result.ok).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    test('should reject check-in date in the past', () => {
      const result = validateStay({
        checkInDate: '2025-09-20', // Yesterday
        checkOutDate: '2025-09-25',
      });
      expect(result.ok).toBe(false);
      expect(result.errors.checkInDate).toBeTruthy();
    });

    test('should reject check-out date before check-in date', () => {
      const result = validateStay({
        checkInDate: '2025-09-22',
        checkOutDate: '2025-09-21', // Before check-in
      });
      expect(result.ok).toBe(false);
      expect(result.errors.checkOutDate).toBeTruthy();
    });

    test('should validate same-day stay with valid times', () => {
      const result = validateStay({
        checkInDate: '2025-09-22',
        checkOutDate: '2025-09-22',
        checkInTime: '10:00',
        checkOutTime: '16:00',
      });
      expect(result.ok).toBe(true);
    });

    test('should reject same-day stay with invalid times', () => {
      const result = validateStay({
        checkInDate: '2025-09-22',
        checkOutDate: '2025-09-22',
        checkInTime: '15:00',
        checkOutTime: '10:00', // Before check-in time
      });
      expect(result.ok).toBe(false);
      expect(result.errors.checkOutTime).toBeTruthy();
    });

    test('should require check-in and check-out dates', () => {
      const result = validateStay({});
      expect(result.ok).toBe(false);
      expect(result.errors.checkInDate).toBeTruthy();
      expect(result.errors.checkOutDate).toBeTruthy();
    });
  });
});
