import type { Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import type { Page } from 'puppeteer';
import { load } from 'cheerio';

import type { ChapterPerformanceReport, SessionActivity } from '@/interfaces';
import { Scraper } from '@/lib/Scraper';
import env from '@/utils/env';

type SessionCounts = Omit<ChapterPerformanceReport['sessions'], 'total' | 'membersSubmitted' | 'submittedBy'>;

const SESSION_REPORT_URL = `${env.MNO_BASE_URL}/${env.MNO_SESSION_REPORT_PATH}`;

export default class SessionDataParser {
  private _scraper: Scraper;
  private _page: Page | null;
  private _sessionReportHtml: Cheerio<Element> | null;
  private _sessionReportJson: SessionActivity[];
  private _validSessions: SessionActivity[];
  private _counts: SessionCounts;

  constructor() {
    this._scraper = new Scraper('session');
    this._page = null;
    this._sessionReportHtml = null;
    this._sessionReportJson = [];
    this._validSessions = [];
    this._counts = { activity: 0, coaching: 0, superGroups: 0, visitor: 0, mno: 0, quick: 0, unknown: 0 };
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
      await this._scraper.close();
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

      this._sessionReportJson.push(sessionActivity);
    });

    console.log(`Successfully parsed ${this._sessionReportJson.length} sessions from table`);
  }

  private validSessions(): void {
    const validSessions = this._sessionReportJson.filter(({ sessionWith, submittedBy, type }) => {
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
    this._counts = {
      activity: 0,
      coaching: 0,
      superGroups: 0,
      visitor: 0,
      mno: 0,
      quick: 0,
      unknown: 0,
    };

    this._validSessions.forEach(({ type }) => {
      this._counts[type.toLowerCase().split(' ')[0]]++;
    });
  }

  private get membersSubmitted(): Set<string> {
    return new Set(this._validSessions.map(({ submittedByName }) => submittedByName));
  }

  get sessionReportData(): ChapterPerformanceReport['sessions'] {
    const { activity, coaching, mno, quick, superGroups, unknown, visitor } = this._counts;
    const total = this._validSessions.length;
    const membersSubmitted = this.membersSubmitted;

    return {
      total,
      activity,
      coaching,
      superGroups,
      visitor,
      mno,
      quick,
      unknown,
      membersSubmitted: membersSubmitted.size,
      submittedBy: Array.from(membersSubmitted),
    };
  }
}
