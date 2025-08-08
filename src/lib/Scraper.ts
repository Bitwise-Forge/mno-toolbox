import fs from 'node:fs';
import path from 'node:path';
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

import env from '@/utils/env';

const BASE_URL = env.MNO_BASE_URL;
const LOGIN_URL = `${BASE_URL}/${env.MNO_LOGIN_PATH}`;
const DASHBOARD_URL = `${BASE_URL}/${env.MNO_DASHBOARD_PATH}`;

const STORAGE_FILE = path.join(process.cwd(), '.session', 'localStorage.json');

export class Scraper {
  private _browser: Browser | null;
  private _page: Page | null;
  private _scope: 'member' | 'event' | 'session' | 'weekly-checklist';

  constructor(scope: 'member' | 'event' | 'session' | 'weekly-checklist') {
    this._browser = null;
    this._page = null;
    this._scope = scope;
  }

  async init(): Promise<void> {
    console.log(`Initializing scraper for ${this._scope} scope...`);

    this._browser = await puppeteer.launch({
      headless: env.PUPPETEER_HEADLESS_MODE,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this._page = await this._browser.newPage();
    this._page.setDefaultNavigationTimeout(15000);
    this._page.setDefaultTimeout(15000);

    await this.loadLocalStorage();

    const isLoggedIn = await this.checkLoginStatus();
    if (!isLoggedIn) await this.login();
  }

  async close(): Promise<void> {
    if (!this._browser) return;
    await this._browser.close();
  }

  get page(): Page | null {
    return this._page;
  }

  private async loadLocalStorage(): Promise<void> {
    if (!this._page) {
      throw new Error('Page not initialized, did you call init() first?');
    }

    try {
      const hasStorageFile = fs.existsSync(STORAGE_FILE);
      if (!hasStorageFile) throw new Error('No localStorage file found');

      const storageData = fs.readFileSync(STORAGE_FILE, 'utf8');
      const localStorage = JSON.parse(storageData) as Record<string, string>;

      await this._page.evaluateOnNewDocument(storage => {
        for (const [key, value] of Object.entries(storage)) {
          globalThis.localStorage.setItem(key, value);
        }
      }, localStorage);

      console.log('Loaded browser session data from file');
    } catch (error) {
      console.error('Error loading browser session data from file:', error);
    }
  }

  private async saveLocalStorage(): Promise<void> {
    if (!this._page) {
      throw new Error('Page not initialized, did you call init() first?');
    }

    try {
      const localStorage = await this._page.evaluate(() => {
        const storage: Record<string, string> = {};

        for (let i = 0; i < globalThis.localStorage.length; i++) {
          const key = globalThis.localStorage.key(i);
          if (!key) continue;

          const value = globalThis.localStorage.getItem(key);
          if (!value) continue;

          storage[key] = value;
        }

        return storage;
      });

      fs.writeFileSync(STORAGE_FILE, JSON.stringify(localStorage, null, 2));
      console.log('Saved browser session data to file');
    } catch (error) {
      console.error('Error saving browser session data to file:', error);
    }
  }

  private async checkLoginStatus(): Promise<boolean> {
    if (!this._page) {
      throw new Error('Page not initialized, did you call init() first?');
    }

    try {
      await this._page.goto(DASHBOARD_URL, { waitUntil: 'networkidle0' });

      const currentUrl = this._page.url();
      if (currentUrl.includes('login')) return false;

      console.log('Already logged in, skipping login step...');
      return true;
    } catch {
      return false;
    }
  }

  private async login(): Promise<void> {
    if (!this._page) {
      throw new Error('Page not initialized, did you call init() first?');
    }

    console.log('Navigating to login page...');
    await this._page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });

    await this._page.waitForSelector('input[name="username"]');
    await this._page.waitForSelector('input[name="password"]');
    await this._page.type('input[name="username"]', env.MNO_USERNAME);
    await this._page.type('input[name="password"]', env.MNO_PASSWORD);

    console.log('Submitting login form...');
    await this._page.click('button[type="button"]');

    try {
      await this._page.waitForNavigation({ waitUntil: 'networkidle0' });
      await this.saveLocalStorage();
      console.log('Successfully logged in!');
    } catch (error) {
      console.error('Login failed or timed out:', error);
      throw new Error('Login failed - check credentials or network connection');
    }
  }
}
