import path from 'node:path';
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

import env from '@/utils/env';

export type ScraperScope = 'members' | 'sessions' | 'events' | 'visitors' | 'weekly-checklist';

const BASE_URL = env.MNO_BASE_URL;
const LOGIN_URL = `${BASE_URL}/${env.MNO_LOGIN_PATH}`;
const DASHBOARD_URL = `${BASE_URL}/${env.MNO_DASHBOARD_PATH}`;

export class Scraper {
  private static _browser: Browser | null = null;
  private static _launchPromise: Promise<Browser> | null = null;
  private static _loginPromise: Promise<void> | null = null;

  private _page: Page | null;
  private _scope: ScraperScope;

  constructor(scope: ScraperScope) {
    this._scope = scope;
    this._page = null;
  }

  private static async ensureBrowser(): Promise<Browser> {
    if (this._browser?.connected) return this._browser;
    if (this._launchPromise) return this._launchPromise;

    this._launchPromise = (async () => {
      try {
        console.log('Launching browser...');

        const browser = await puppeteer.launch({
          headless: env.PUPPETEER_HEADLESS_MODE,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          userDataDir: path.join(process.cwd(), '.session', 'chrome-profile'),
        });

        this._browser = browser;

        this._browser.on('disconnected', () => {
          Scraper._browser = null;
          Scraper._launchPromise = null;
          Scraper._loginPromise = null;
        });

        return browser;
      } catch (error) {
        this._launchPromise = null;
        throw error;
      }
    })();

    this._launchPromise.catch(error => {
      console.error('Error launching browser:', error);
      this._launchPromise = null;
    });

    return this._launchPromise;
  }

  private static async createConfiguredPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(15000);
    page.setDefaultTimeout(15000);

    return page;
  }

  private static async ensureLoggedIn(browser: Browser): Promise<void> {
    if (this._loginPromise) return this._loginPromise;

    this._loginPromise = (async () => {
      const page = await this.createConfiguredPage(browser);

      try {
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle0' });
        const url = page.url();

        if (!url.includes('login')) {
          console.log('Already authenticated, skipping login...');
          return;
        }

        console.log('Logging in...');
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });
        await page.waitForSelector('input[name="username"]');
        await page.waitForSelector('input[name="password"]');
        await page.type('input[name="username"]', env.MNO_USERNAME);
        await page.type('input[name="password"]', env.MNO_PASSWORD);
        await page.click('button[type="button"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
      } finally {
        await page.close();
      }
    })();

    this._loginPromise.catch(error => {
      console.error('Error logging in:', error);
      this._loginPromise = null;
    });

    return this._loginPromise;
  }

  static async getSharedPage(scope: ScraperScope): Promise<Page> {
    const browser = await this.ensureBrowser();
    await this.ensureLoggedIn(browser);

    console.error(`Creating configured page for ${scope}...`);
    return await this.createConfiguredPage(browser);
  }

  static async shutdown(): Promise<void> {
    if (!this._browser) return;

    try {
      await this._browser.close();
    } finally {
      this._browser = null;
      this._launchPromise = null;
      this._loginPromise = null;
    }
  }

  async init(): Promise<void> {
    this._page = await Scraper.getSharedPage(this._scope);
  }

  async close(scope: ScraperScope): Promise<void> {
    if (this._page) {
      console.error(`Closing page for ${scope}...`);
      await this._page.close();
    }

    this._page = null;
  }

  get page(): Page | null {
    return this._page;
  }
}
