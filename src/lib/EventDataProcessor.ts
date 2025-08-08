import type { Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import { load } from 'cheerio';

import type { ChapterPerformanceReport, EventActivity } from '@/interfaces';
import { Scraper } from '@/lib/Scraper';

type EventCounts = Omit<ChapterPerformanceReport['events'], 'total' | 'membersSubmitted' | 'submittedBy'>;

export default class EventDataParser {
  private _scraper: Scraper;
  private _eventReportHtml: Cheerio<Element> | null;
  private _eventReportJson: EventActivity[];
  private _validEvents: EventActivity[];
  private _counts: EventCounts;

  constructor() {
    this._scraper = new Scraper('event');
    this._eventReportHtml = null;
    this._eventReportJson = [];
    this._validEvents = [];
    this._counts = { training: 0, seminar: 0, mixer: 0, show: 0, openMic: 0, promoParty: 0, other: 0, listeningViewing: 0 };
  }

  async init(): Promise<void> {
    await this._scraper.init();
    this._eventReportHtml = await this._scraper.getEventReport();
    await this._scraper.close();

    this.parse();
    this.validEvents();
    this.countEventTypes();
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

      this._eventReportJson.push(eventActivity);
    });

    console.log(`Successfully parsed ${this._eventReportJson.length} events from table`);
  }

  private validEvents(): void {
    this._validEvents = this._eventReportJson.filter(
      ({ attendingMember, attendingMemberName }) =>
        !attendingMemberName.toLowerCase().startsWith('executive') && !attendingMember.toLowerCase().startsWith('no data'),
    );

    console.log(`Successfully identified ${this._validEvents.length} valid events`);
  }

  private static eventTypeMap: Record<keyof EventCounts, string> = {
    training: 'training',
    seminar: 'seminar',
    mixer: 'mixer',
    show: 'show',
    openMic: 'open mic',
    promoParty: 'promo party',
    other: 'other',
    listeningViewing: 'Listening/Viewing',
  };

  private countEventTypes(): void {
    this._counts = { training: 0, seminar: 0, mixer: 0, show: 0, openMic: 0, promoParty: 0, other: 0, listeningViewing: 0 };

    this._validEvents.forEach(({ eventType }) => {
      const eventTypeKey = Object.keys(EventDataParser.eventTypeMap).find(
        key => EventDataParser.eventTypeMap[key as keyof EventCounts] === eventType,
      );

      if (!eventTypeKey) {
        console.log(`Unknown event type: ${eventType}`);
        return;
      }

      this._counts[eventTypeKey as keyof EventCounts]++;
    });
  }

  private get membersSubmitted(): Set<string> {
    return new Set(this._validEvents.map(({ attendingMemberName }) => attendingMemberName));
  }

  get eventReportData(): ChapterPerformanceReport['events'] {
    const { listeningViewing, mixer, openMic, other, promoParty, seminar, show, training } = this._counts;
    const total = this._validEvents.length;
    const membersSubmitted = this.membersSubmitted;

    return {
      total,
      training,
      seminar,
      mixer,
      show,
      openMic,
      promoParty,
      other,
      listeningViewing,
      membersSubmitted: membersSubmitted.size,
      submittedBy: Array.from(membersSubmitted),
    };
  }
}
