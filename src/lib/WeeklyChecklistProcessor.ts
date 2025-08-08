import type { Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import type { Page } from 'puppeteer';
import { load } from 'cheerio';
import dayjs from 'dayjs';

import type { MemberActivity, WeeklyChecklist, WeeklyChecklistReport } from '@/interfaces';
import { Scraper } from '@/lib/Scraper';
import env from '@/utils/env';

const SM_REPORT_URL = `${env.MNO_BASE_URL}/${env.MNO_SM_REPORT_PATH}`;
const WEEKLY_CHECKLIST_URL = `${env.MNO_BASE_URL}/${env.MNO_WEEKLY_CHECKLIST_PATH}`;

export default class WeeklyChecklistProcessor {
  private _scraper: Scraper;
  private _page: Page | null;
  private _memberReportHtml: Cheerio<Element> | null;
  private _memberReportJson: Pick<MemberActivity, 'firstName' | 'lastName' | 'name'>[];
  private _weeklyChecklistHtml: Cheerio<Element> | null;
  private _weeklyChecklistJson: WeeklyChecklist[];

  constructor() {
    this._scraper = new Scraper('weekly-checklist');
    this._page = null;
    this._memberReportHtml = null;
    this._memberReportJson = [];
    this._weeklyChecklistHtml = null;
    this._weeklyChecklistJson = [];
  }

  async init(): Promise<void> {
    await this._scraper.init();
    this._page = this._scraper.page;
    this._memberReportHtml = await this.getSmReport();
    this._weeklyChecklistHtml = await this.getWeeklyChecklist();

    this.parseMemberReport();
    this.parseChecklist();
  }

  private async getSmReport(): Promise<Cheerio<Element>> {
    if (!this._page) {
      throw new Error('Page not initialized, did you call init() first?');
    }

    console.log('Navigating to SM Report page...');

    try {
      await this._page.goto(SM_REPORT_URL, { waitUntil: 'networkidle0' });

      const $ = load(await this._page.content());
      const table = $('table');

      if (table.length === 0) {
        throw new Error('SM Report table not found - page may have changed or access denied');
      }

      console.log('Successfully extracted table from SM Report page');
      return table;
    } catch (error) {
      console.error('Error navigating to SM Report page:', error);
      throw error;
    }
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
      await this._scraper.close();
    }
  }

  private parseMemberReport(): void {
    if (!this._memberReportHtml) {
      throw new Error('Member report not found. Did you call init()?');
    }

    const tableHtml = this._memberReportHtml.html();

    if (!tableHtml) {
      throw new Error('No table HTML content found');
    }

    const $ = load(`<table>${tableHtml}</table>`);
    const rows = $('tbody tr');

    rows.each((_, row) => {
      const cells = $(row).find('td');

      const memberName = cells.eq(0).text().trim();

      const nameParts = memberName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const name = `${firstName} ${lastName[0]}.`;

      const memberActivity: Pick<MemberActivity, 'firstName' | 'lastName' | 'name'> = { firstName, lastName, name };

      this._memberReportJson.push(memberActivity);
    });

    console.log(`Successfully parsed ${this._memberReportJson.length} members from table`);
  }

  private parseChecklist(): void {
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

  private get uniqueMembersMinusEp(): string[] {
    return Array.from(
      new Set(this._memberReportJson.filter(({ name }) => !name.toLowerCase().startsWith('executive')).map(({ name }) => name)),
    );
  }

  private get submittedBy(): string[] {
    return Array.from(new Set(this._weeklyChecklistJson.map(({ memberName }) => memberName)));
  }

  get weeklyChecklistReport(): WeeklyChecklistReport {
    return {
      membersList: this.uniqueMembersMinusEp,
      totalChecklists: this._weeklyChecklistJson.length,
      checklistPercentage: Number.parseFloat(((this._weeklyChecklistJson.length / this.uniqueMembersMinusEp.length) * 100).toFixed(2)),
      submittedBy: this.submittedBy,
    };
  }
}
