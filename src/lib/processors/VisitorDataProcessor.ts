import type { Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import type { Page } from 'puppeteer';
import { load } from 'cheerio';

import type { ChapterPerformanceReport } from '@/interfaces';
import type { ScraperScope } from '@/lib/Scraper';
import { Scraper } from '@/lib/Scraper';
import env from '@/utils/env';

const ViSITOR_REPORT_URL = `${env.MNO_BASE_URL}/${env.MNO_VISITORS_PATH}`;

export default class VisitorDataParser {
  private _scraper: Scraper;
  private _scope: ScraperScope = 'visitors';
  private _page: Page | null;
  private _visitorReportHtml: Cheerio<Element> | null;
  private _visitorReportData: string[];

  constructor() {
    this._scraper = new Scraper(this._scope);
    this._page = null;
    this._visitorReportHtml = null;
    this._visitorReportData = [];
  }

  async init(): Promise<void> {
    await this._scraper.init();
    this._page = this._scraper.page;

    this._visitorReportHtml = await this.getVisitorReport();
    this.parse();
  }

  private async getVisitorReport(): Promise<Cheerio<Element>> {
    if (!this._page) {
      throw new Error('Page not initialized, did you call init() first?');
    }

    console.log('Navigating to Visitor Report page...');

    try {
      await this._page.goto(ViSITOR_REPORT_URL, { waitUntil: 'networkidle0' });

      const $ = load(await this._page.content());
      const table = $('table');

      if (table.length === 0) {
        throw new Error('Visitor Report table not found - page may have changed or access denied');
      }

      console.log('Successfully extracted table from Visitor Report page');
      return table;
    } catch (error) {
      console.error('Error navigating to Visitor Report page:', error);
      throw error;
    } finally {
      await this._scraper.close(this._scope);
    }
  }

  private parse(): void {
    if (!this._visitorReportHtml) {
      throw new Error('Visitor report not found. Did you call init()?');
    }

    const tableHtml = this._visitorReportHtml.html();

    if (!tableHtml) {
      throw new Error('No table HTML content found');
    }

    const $ = load(`<table>${tableHtml}</table>`);
    const rows = $('tbody tr');

    rows.each((_, row) => {
      const cells = $(row).find('td');
      const visitorName = cells.eq(0).text().trim();

      this._visitorReportData.push(visitorName);
    });

    console.log(`Successfully parsed ${this._visitorReportData.length} visitors from table`);
  }

  get visitorReportData(): ChapterPerformanceReport['visitors'] {
    const visitorsList = this._visitorReportData;
    return { totalVisitors: visitorsList.length, visitorsList };
  }
}
