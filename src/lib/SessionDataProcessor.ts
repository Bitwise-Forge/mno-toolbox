import type { Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import { load } from 'cheerio';

import type { ChapterPerformanceReport, SessionActivity } from '@/interfaces';
import { Scraper } from '@/lib/Scraper';

type SessionCounts = Omit<ChapterPerformanceReport['sessions'], 'total' | 'membersSubmitted' | 'submittedBy'>;

export default class SessionDataParser {
  private _scraper: Scraper;
  private _sessionReportHtml: Cheerio<Element> | null;
  private _sessionReportJson: SessionActivity[];
  private _validSessions: SessionActivity[];
  private _counts: SessionCounts;

  constructor() {
    this._scraper = new Scraper('session');
    this._sessionReportHtml = null;
    this._sessionReportJson = [];
    this._validSessions = [];
    this._counts = { activity: 0, coaching: 0, superGroups: 0, visitor: 0, mno: 0, quick: 0, unknown: 0 };
  }

  async init(): Promise<void> {
    await this._scraper.init();
    this._sessionReportHtml = await this._scraper.getSessionReport();
    await this._scraper.close();

    this.parse();
    this.validSessions();
    this.countSessionTypes();
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
