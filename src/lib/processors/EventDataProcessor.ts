import type { Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import type { Page } from 'puppeteer';
import { load } from 'cheerio';

import type { ChapterPerformanceReport, EventActivity } from '@/interfaces';
import type { ScraperScope } from '@/lib/Scraper';
import { Scraper } from '@/lib/Scraper';
import env from '@/utils/env';

type EventCounts = Omit<ChapterPerformanceReport['events'], 'total' | 'membersSubmitted' | 'submittedBy'>;

const EVENT_REPORT_URL = `${env.MNO_BASE_URL}/${env.MNO_EVENT_REPORT_PATH}`;

export default class EventDataParser {
  private _scraper: Scraper;
  private _scope: ScraperScope = 'events';
  private _page: Page | null;
  private _eventReportHtml: Cheerio<Element> | null;
  private _eventReportData: EventActivity[];
  private _validEvents: EventActivity[];
  private _counts: EventCounts;

  constructor() {
    this._scraper = new Scraper(this._scope);
    this._page = null;
    this._eventReportHtml = null;
    this._eventReportData = [];
    this._validEvents = [];
    this._counts = { listeningViewing: 0, mixer: 0, openMic: 0, other: 0, promoParty: 0, seminar: 0, show: 0, training: 0 };
  }

  async init(): Promise<void> {
    await this._scraper.init();
    this._page = this._scraper.page;
    this._eventReportHtml = await this.getEventReport();

    this.parse();
    this.validEvents();
    this.countEventTypes();
  }

  private async getEventReport(): Promise<Cheerio<Element>> {
    if (!this._page) {
      throw new Error('Page not initialized, did you call init() first?');
    }

    console.log('Navigating to Event Report page...');

    try {
      await this._page.goto(EVENT_REPORT_URL, { waitUntil: 'networkidle0' });

      const $ = load(await this._page.content());
      const table = $('table').last();

      if (table.length === 0) {
        throw new Error('Event Report table not found - page may have changed or access denied');
      }

      console.log('Successfully extracted table from Event Report page');
      return table;
    } catch (error) {
      console.error('Error navigating to Event Report page:', error);
      throw error;
    } finally {
      await this._scraper.close(this._scope);
    }
  }

  private parse(): void {
    if (!this._eventReportHtml) {
      throw new Error('Event report not found. Did you call init()?');
    }

    const tableHtml = this._eventReportHtml.html();

    if (!tableHtml) {
      throw new Error('No table HTML content found');
    }

    const $ = load(`<table>${tableHtml}</table>`);
    const rows = $('tbody tr');

    rows.each((_, row) => {
      const cells = $(row).find('td');

      const attendingMember = cells.eq(0).text().trim();
      const eventBy = cells.eq(1).text().trim();
      const eventType = cells.eq(2).text().trim();

      const [attendingMemberFirstName, attendingMemberLastName] = attendingMember.split(' ');
      const attendingMemberName = `${attendingMemberFirstName} ${attendingMemberLastName[0]}.`;

      const eventActivity: EventActivity = { attendingMember, attendingMemberName, eventBy, eventType };

      this._eventReportData.push(eventActivity);
    });

    console.log(`Successfully parsed ${this._eventReportData.length} events from table`);
  }

  private validEvents(): void {
    this._validEvents = this._eventReportData.filter(
      ({ attendingMember, attendingMemberName }) =>
        !attendingMemberName.toLowerCase().startsWith('executive') && !attendingMember.toLowerCase().startsWith('no data'),
    );

    console.log(`Successfully identified ${this._validEvents.length} valid events`);
  }

  private static typeMap: Record<keyof EventCounts, string> = {
    listeningViewing: 'listening/viewing',
    mixer: 'mixer',
    openMic: 'open mic',
    other: 'other',
    promoParty: 'promo party',
    seminar: 'seminar',
    show: 'show',
    training: 'training',
  };

  private countEventTypes(): void {
    this._validEvents.forEach(({ eventType }) => {
      let formattedEventType = eventType.toLowerCase() as keyof EventCounts;
      const eventTypeKey = Object.keys(EventDataParser.typeMap).find(key => EventDataParser.typeMap[key] === formattedEventType);

      if (!eventTypeKey) {
        console.log(`Unknown event type: ${eventType}`);
        formattedEventType = 'other';
      }

      this._counts[eventTypeKey as keyof EventCounts]++;
    });
  }

  private get membersSubmitted(): Set<string> {
    return new Set(
      this._validEvents
        .map(({ attendingMemberName }) => attendingMemberName)
        .toSorted((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    );
  }

  get eventReportData(): ChapterPerformanceReport['events'] {
    const total = this._validEvents.length;
    return { total, ...this._counts, submittedBy: Array.from(this.membersSubmitted) };
  }
}
