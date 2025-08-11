import type { Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import type { Page } from 'puppeteer';
import { load } from 'cheerio';
import dayjs from 'dayjs';

import type { ChapterPerformanceReport, WeeklyChecklist, WeeklyChecklistReport } from '@/interfaces';
import type { ScraperScope } from '@/lib/Scraper';
import { Scraper } from '@/lib/Scraper';
import env from '@/utils/env';

const WEEKLY_CHECKLIST_URL = `${env.MNO_BASE_URL}/${env.MNO_WEEKLY_CHECKLIST_PATH}`;

export default class WeeklyChecklistProcessor {
  private _scraper: Scraper;
  private _scope: ScraperScope = 'weekly-checklist';
  private _page: Page | null;
  private _memberReportData: ChapterPerformanceReport['members'];
  private _weeklyChecklistHtml: Cheerio<Element> | null;
  private _weeklyChecklistJson: WeeklyChecklist[];

  constructor(memberData: ChapterPerformanceReport['members']) {
    this._scraper = new Scraper(this._scope);
    this._page = null;
    this._memberReportData = memberData;
    this._weeklyChecklistHtml = null;
    this._weeklyChecklistJson = [];
  }

  async init(): Promise<void> {
    await this._scraper.init();
    this._page = this._scraper.page;
    this._weeklyChecklistHtml = await this.getWeeklyChecklist();

    this.parse();
  }

  private async getWeeklyChecklist(): Promise<Cheerio<Element>> {
    if (!this._page) {
      throw new Error('Page not initialized, did you call init() first?');
    }

    console.log('Navigating to Weekly Checklist page...');

    const startDate = dayjs(env.REPORT_START_DATE).format('MM/DD/YYYY');
    const endDate = dayjs(env.REPORT_END_DATE).format('MM/DD/YYYY');

    try {
      await this._page.goto(WEEKLY_CHECKLIST_URL, { waitUntil: 'networkidle0' });
      await this._page.waitForSelector('input[name="date"]');
      await this._page.type('input[name="date"]', `${startDate} - ${endDate}`);
      await this._page.keyboard.press('Enter');
      await this._page.waitForNetworkIdle();

      const $ = load(await this._page.content());
      const table = $('table').last();

      if (table.length === 0) {
        throw new Error('Weekly Checklist table not found - page may have changed or access denied');
      }

      console.log('Successfully extracted table from Weekly Checklist page');
      return table;
    } catch (error) {
      console.error('Error navigating to Weekly Checklist page:', error);
      throw error;
    } finally {
      await this._scraper.close(this._scope);
    }
  }

  private parse(): void {
    if (!this._weeklyChecklistHtml) {
      throw new Error('Weekly checklist report not found, did you call init() first?');
    }

    const tableHtml = this._weeklyChecklistHtml.html();

    if (!tableHtml) {
      throw new Error('No table HTML content found');
    }

    const $ = load(`<table>${tableHtml}</table>`);
    const rows = $('tbody tr');

    rows.each((_, row) => {
      const cells = $(row).find('td');

      const member = cells.eq(0).text().trim();
      const date = cells.eq(2).text().trim();

      const [memberFirstName, memberLastName] = member.split(' ');
      const memberName = `${memberFirstName} ${memberLastName[0]}.`;

      this._weeklyChecklistJson.push({ date, member, memberName });
    });

    console.log(`Successfully parsed ${this._weeklyChecklistJson.length} checklists from table`);
  }

  private get submittedBy(): string[] {
    return Array.from(new Set(this._weeklyChecklistJson.map(({ memberName }) => memberName)));
  }

  get weeklyChecklistReport(): WeeklyChecklistReport {
    const membersList = this._memberReportData.membersList;
    const totalChecklists = this._weeklyChecklistJson.length;
    const missingChecklists = membersList.filter(member => !this.submittedBy.includes(member));

    return { membersList, totalChecklists, submittedBy: this.submittedBy, missingChecklists };
  }
}
