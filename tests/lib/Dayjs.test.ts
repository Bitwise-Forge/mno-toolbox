import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const FIXED_DATE = '2025-08-23T12:00:00Z';

describe('Dayjs', () => {
  beforeEach(() => {
    // Mock system time to a fixed date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_DATE));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be properly configured with all required plugins', async () => {
    const dayjs = (await import('@/lib/Dayjs')).default;
    const testDate = dayjs(FIXED_DATE);

    expect(typeof dayjs).toBe('function');
    expect(typeof testDate.utc).toBe('function');
    expect(typeof testDate.tz).toBe('function');
  });

  it('should have timezone default set to America/New_York', async () => {
    const dayjs = (await import('@/lib/Dayjs')).default;
    const testDate = dayjs(FIXED_DATE);
    const tzDate = testDate.tz();

    expect(tzDate.format('z')).toMatch(/^EDT$/);
  });

  it('should format dates with timezone abbreviations correctly', async () => {
    const dayjs = (await import('@/lib/Dayjs')).default;

    const winterDate = dayjs('2025-01-01T12:00:00Z');
    const winterFormatted = winterDate.format('MM/DD/YYYY hh:mm A z');
    expect(winterFormatted).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} [AP]M EST$/);
  });

  it('should maintain consistency across multiple imports (singleton behavior)', async () => {
    const dayjs1 = (await import('@/lib/Dayjs')).default;
    const dayjs2 = (await import('@/lib/Dayjs')).default;

    expect(dayjs1).toBe(dayjs2);
  });
});
