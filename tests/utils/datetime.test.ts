import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import dayjs from '@/lib/Dayjs';
import { formatDateWithTzSupport, isValidDate } from '@/utils/datetime';

const FIXED_DATE = '2025-08-23T12:00:00Z';

describe('datetime utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_DATE));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDateWithTzSupport', () => {
    const testDate = dayjs(FIXED_DATE);

    const tests = [
      { format: 'MM/DD/YYYY hh:mm A z', expected: '08/23/2025 08:00 AM EDT' },
      { format: 'YYYY-MM-DD', expected: '2025-08-23' },
      { format: 'MM/DD/YYYY', expected: '08/23/2025' },
      { format: 'HH:mm:ss', expected: '08:00:00' },
      { format: 'MM/DD/YYYY hh:mm A z', expected: '08/23/2025 08:00 AM EDT' },
    ];

    it.each(tests)('should format "$format" to "$expected"', ({ expected, format }) => {
      expect(formatDateWithTzSupport(testDate, format)).toBe(expected);
    });
  });

  describe('isValidDate', () => {
    const tests = [
      { date: new Date(), expected: true },
      { date: new Date(FIXED_DATE), expected: true },
      { date: 'not-a-date', expected: false },
      { date: NaN, expected: false },
      { date: Infinity, expected: false },
      { date: -Infinity, expected: false },
      { date: '', expected: false },
      { date: undefined, expected: false },
      { date: null, expected: false },
    ];

    it.each(tests)('should return "$expected" for "$date"', ({ date, expected }) => {
      expect(isValidDate(date as never)).toBe(expected);
    });
  });
});
