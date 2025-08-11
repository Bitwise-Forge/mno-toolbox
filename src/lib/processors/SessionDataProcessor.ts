import type { Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import type { Page } from 'puppeteer';
import { load } from 'cheerio';

import type { ChapterPerformanceReport, SessionActivity } from '@/interfaces';
import type { ScraperScope } from '@/lib/Scraper';
import { Scraper } from '@/lib/Scraper';
import env from '@/utils/env';

type SessionCounts = Omit<ChapterPerformanceReport['sessions'], 'total' | 'membersSubmitted' | 'submittedBy'>;

const SESSION_REPORT_URL = `${env.MNO_BASE_URL}/${env.MNO_SESSION_REPORT_PATH}`;

export default class SessionDataParser {
  private _scraper: Scraper;
  private _scope: ScraperScope = 'sessions';
  private _page: Page | null;
  private _sessionReportHtml: Cheerio<Element> | null;
  private _sessionReportData: SessionActivity[];
  private _validSessions: SessionActivity[];
  private _counts: SessionCounts;

  constructor() {
    this._scraper = new Scraper(this._scope);
    this._page = null;
    this._sessionReportHtml = null;
    this._sessionReportData = [];
    this._validSessions = [];
    this._counts = { activity: 0, coaching: 0, mno: 0, quick: 0, superGroups: 0, unknown: 0, visitor: 0 };
  }

  async init(): Promise<void> {
    await this._scraper.init();
    this._page = this._scraper.page;
    this._sessionReportHtml = await this.getSessionReport();

    this.parse();
    this.validSessions();
    this.countSessionTypes();
  }

  private async getSessionReport(): Promise<Cheerio<Element>> {
    if (!this._page) {
      throw new Error('Page not initialized, did you call init() first?');
    }

    console.log('Navigating to Session Report page...');

    try {
      await this._page.goto(SESSION_REPORT_URL, { waitUntil: 'networkidle0' });

      const $ = load(await this._page.content());
      const table = $('table').last();

      if (table.length === 0) {
        throw new Error('Session Report table not found - page may have changed or access denied');
      }

      console.log('Successfully extracted table from Session Report page');
      return table;
    } catch (error) {
      console.error('Error navigating to Session Report page:', error);
      throw error;
    } finally {
      await this._scraper.close(this._scope);
    }
  }

  private parse(): void {
    if (!this._sessionReportHtml) {
      throw new Error('Session report not found. Did you call init()?');
    }

    const tableHtml = this._sessionReportHtml.html();

    if (!tableHtml) {
      throw new Error('No table HTML content found');
    }

    const $ = load(`<table>${tableHtml}</table>`);
    const rows = $('tbody tr');

    rows.each((_, row) => {
      const cells = $(row).find('td');

      const submittedBy = cells.eq(0).text().trim();
      const sessionWith = cells.eq(1).text().trim();
      const type = cells.eq(2).text().trim();

      const [submittedByFirstName, submittedByLastName] = submittedBy.split(' ');
      const submittedByName = `${submittedByFirstName} ${submittedByLastName[0]}.`;

      const sessionActivity: SessionActivity = { submittedBy, submittedByName, sessionWith, type };

      this._sessionReportData.push(sessionActivity);
    });

    console.log(`Successfully parsed ${this._sessionReportData.length} sessions from table`);
  }

  private validSessions(): void {
    const validSessions = this._sessionReportData.filter(({ sessionWith, submittedBy, type }) => {
      const isLeadershipSession = type.toLowerCase().startsWith('leadership');
      const isWithExecutiveProducer = sessionWith.toLowerCase().startsWith('executive producer');
      const isVisitorSession = type.toLowerCase().startsWith('visitor');
      const isNoData = submittedBy.toLowerCase().startsWith('no data');

      if (isNoData) return false;
      if (isLeadershipSession) return false;
      if (isWithExecutiveProducer && !isVisitorSession) return false;

      return true;
    });

    console.log(`Successfully identified ${validSessions.length} valid sessions`);
    this._validSessions = validSessions;
  }

  private countSessionTypes(): void {
    this._validSessions.forEach(({ type }) => {
      this._counts[type.toLowerCase().split(' ')[0]]++;
    });
  }

  private get membersSubmitted(): Set<string> {
    return new Set(
      this._validSessions
        .map(({ submittedByName }) => submittedByName)
        .toSorted((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    );
  }

  get sessionReportData(): ChapterPerformanceReport['sessions'] {
    const total = this._validSessions.length;
    return { total, ...this._counts, submittedBy: Array.from(this.membersSubmitted) };
  }
}
