import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('env', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('URL validation', () => {
    it('should accept valid URLs', async () => {
      process.env.MNO_BASE_URL = 'https://api.example.com';

      const { default: env } = await import('@/utils/env');
      expect(env.MNO_BASE_URL).toBe('https://api.example.com');
    });

    it('should reject invalid URLs', async () => {
      process.env.MNO_BASE_URL = 'not-a-url';

      await expect(import('@/utils/env')).rejects.toThrow();
    });

    it('should reject empty URLs', async () => {
      process.env.MNO_BASE_URL = '';

      await expect(import('@/utils/env')).rejects.toThrow();
    });
  });

  describe('Email validation', () => {
    it('should accept valid email addresses', async () => {
      process.env.MNO_USERNAME = 'user@domain.com';

      const { default: env } = await import('@/utils/env');
      expect(env.MNO_USERNAME).toBe('user@domain.com');
    });

    it('should reject invalid email addresses', async () => {
      process.env.MNO_USERNAME = 'not-an-email';

      await expect(import('@/utils/env')).rejects.toThrow();
    });

    it('should reject empty email addresses', async () => {
      process.env.MNO_USERNAME = '';

      await expect(import('@/utils/env')).rejects.toThrow();
    });
  });

  describe('Date format validation', () => {
    it('should accept valid date formats (YYYY-MM-DD)', async () => {
      process.env.REPORT_START_DATE = '2024-01-15';
      process.env.REPORT_END_DATE = '2024-12-31';

      const { default: env } = await import('@/utils/env');
      expect(env.REPORT_START_DATE).toBe('2024-01-15');
      expect(env.REPORT_END_DATE).toBe('2024-12-31');
    });

    it('should reject invalid date formats', async () => {
      process.env.REPORT_START_DATE = '01/15/2024';

      await expect(import('@/utils/env')).rejects.toThrow();
    });

    it('should reject malformed dates', async () => {
      process.env.REPORT_START_DATE = '2024-13-45';

      await expect(import('@/utils/env')).rejects.toThrow();
    });

    it('should reject dates with wrong separators', async () => {
      process.env.REPORT_START_DATE = '2024.01.15';

      await expect(import('@/utils/env')).rejects.toThrow();
    });
  });

  describe('Boolean transformation', () => {
    it('should transform "true" string to boolean true', async () => {
      process.env.PUPPETEER_HEADLESS_MODE = 'true';

      const { default: env } = await import('@/utils/env');
      expect(env.PUPPETEER_HEADLESS_MODE).toBe(true);
    });

    it('should transform "false" string to boolean false', async () => {
      process.env.PUPPETEER_HEADLESS_MODE = 'false';

      const { default: env } = await import('@/utils/env');
      expect(env.PUPPETEER_HEADLESS_MODE).toBe(false);
    });

    it('should transform any other string to boolean false', async () => {
      process.env.PUPPETEER_HEADLESS_MODE = 'anything-else';

      const { default: env } = await import('@/utils/env');
      expect(env.PUPPETEER_HEADLESS_MODE).toBe(false);
    });
  });

  describe('String validation', () => {
    it('should accept non-empty strings for path fields', async () => {
      process.env.MNO_DASHBOARD_PATH = '/custom/dashboard';
      process.env.MNO_LOGIN_PATH = '/auth/login';

      const { default: env } = await import('@/utils/env');
      expect(env.MNO_DASHBOARD_PATH).toBe('/custom/dashboard');
      expect(env.MNO_LOGIN_PATH).toBe('/auth/login');
    });

    it('should reject empty strings for required fields', async () => {
      process.env.MNO_DASHBOARD_PATH = '';

      await expect(import('@/utils/env')).rejects.toThrow();
    });

    it('should reject undefined values for required fields', async () => {
      delete process.env.MNO_DASHBOARD_PATH;

      await expect(import('@/utils/env')).rejects.toThrow();
    });
  });

  describe('Enum validation', () => {
    it('should accept valid NODE_ENV values', async () => {
      process.env.NODE_ENV = 'production';

      const { default: env } = await import('@/utils/env');
      expect(env.NODE_ENV).toBe('production');
    });

    it('should default NODE_ENV to development when not provided', async () => {
      delete process.env.NODE_ENV;

      const { default: env } = await import('@/utils/env');
      expect(env.NODE_ENV).toBe('development');
    });

    it('should reject invalid NODE_ENV values', async () => {
      process.env.NODE_ENV = 'staging';

      await expect(import('@/utils/env')).rejects.toThrow();
    });
  });

  describe('Complete environment validation', () => {
    it('should successfully validate a complete valid environment', async () => {
      const { default: env } = await import('@/utils/env');

      expect(env.MNO_BASE_URL).toBe('https://example.mnoapp.com');
      expect(env.MNO_USERNAME).toBe('you@example.com');
      expect(env.MNO_PASSWORD).toBe('yourpassword');
      expect(env.NODE_ENV).toBe('test');
      expect(env.PUPPETEER_HEADLESS_MODE).toBe(true);
      expect(env.REPORT_START_DATE).toBe('2025-08-22');
      expect(env.REPORT_END_DATE).toBe('2025-08-28');
    });

    it('should handle emptyStringAsUndefined option correctly', async () => {
      process.env.MNO_DASHBOARD_PATH = '';

      await expect(import('@/utils/env')).rejects.toThrow();
    });
  });

  describe('Error scenarios', () => {
    it('should throw error when required field is missing', async () => {
      delete process.env.MNO_BASE_URL;

      await expect(import('@/utils/env')).rejects.toThrow();
    });

    it('should throw error for invalid URL format', async () => {
      process.env.MNO_BASE_URL = 'ftp://invalid-protocol.com';
      process.env.MNO_BASE_URL = 'not-a-url-at-all';

      await expect(import('@/utils/env')).rejects.toThrow();
    });
  });
});
