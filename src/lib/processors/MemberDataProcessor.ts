import type { Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import type { Page } from 'puppeteer';
import { load } from 'cheerio';

import type { ChapterPerformanceReport, MemberActivity } from '@/interfaces';
import type { ScraperScope } from '@/lib/Scraper';
import { Scraper } from '@/lib/Scraper';
import env from '@/utils/env';
import { roundTo } from '@/utils/numberUtils';

const SM_REPORT_URL = `${env.MNO_BASE_URL}/${env.MNO_SM_REPORT_PATH}`;

export default class MemberDataParser {
  private _scraper: Scraper;
  private _scope: ScraperScope = 'members';
  private _page: Page | null;
  private _memberReportHtml: Cheerio<Element> | null;
  private _memberReportData: MemberActivity[];

  constructor() {
    this._scraper = new Scraper(this._scope);
    this._page = null;
    this._memberReportHtml = null;
    this._memberReportData = [];
  }

  async init(): Promise<void> {
    await this._scraper.init();
    this._page = this._scraper.page;

    this._memberReportHtml = await this.getSmReport();
    this.parse();
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
    } finally {
      await this._scraper.close(this._scope);
    }
  }

  private parse(): void {
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
      const businessBucksText = cells.eq(3).text().trim();
      const referrals = parseInt(cells.eq(4).text().trim()) || 0;
      const visitors = parseInt(cells.eq(5).text().trim()) || 0;
      const sessions = parseInt(cells.eq(6).text().trim()) || 0;
      const eventAttendance = parseInt(cells.eq(7).text().trim()) || 0;
      const posts = parseInt(cells.eq(8).text().trim()) || 0;

      const nameParts = memberName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const name = `${firstName} ${lastName[0]}.`;
      const businessBucks = businessBucksText ? parseFloat(businessBucksText) : 0;
      const total = sessions + referrals + eventAttendance + posts + visitors + businessBucks;

      const memberActivity: MemberActivity = {
        firstName,
        lastName,
        name,
        sessions,
        referrals,
        businessBucks,
        eventAttendance,
        posts,
        visitors,
        total,
      };

      this._memberReportData.push(memberActivity);
    });

    console.log(`Successfully parsed ${this._memberReportData.length} members from table`);
  }

  private get uniqueMembersMinusEp(): MemberActivity[] {
    return Array.from(new Set(this._memberReportData.filter(({ name }) => !name.toLowerCase().startsWith('executive')))).toSorted(
      (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
  }

  private get totalMembers(): number {
    return this.uniqueMembersMinusEp.length;
  }

  private get zeroActivityList(): Set<string> {
    return new Set(this.uniqueMembersMinusEp.filter(({ total }) => total === 0).map(({ name }) => name));
  }

  private get lowActivityList(): Set<string> {
    return new Set(this.uniqueMembersMinusEp.filter(({ total }) => total === 1).map(({ name }) => name));
  }

  private get totalPosts(): number {
    return this.uniqueMembersMinusEp.reduce((acc, { posts }) => acc + posts, 0);
  }

  private get avgPostsPerMember(): number {
    return roundTo(this.totalPosts / this.totalMembers);
  }

  private get avgRoundsOfPosts(): { raw: number; rounded: number } {
    return {
      raw: roundTo(this.avgPostsPerMember / this.totalMembers),
      rounded: roundTo(this.avgPostsPerMember / this.totalMembers, 0),
    };
  }

  private get referrers(): MemberActivity[] {
    return this._memberReportData
      .filter(({ referrals }) => referrals > 0)
      .toSorted((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  }

  private get businessBucksReceivers(): MemberActivity[] {
    return this._memberReportData
      .filter(({ businessBucks }) => businessBucks > 0)
      .toSorted((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  }

  get memberReportData(): ChapterPerformanceReport['members'] {
    const membersList = this.uniqueMembersMinusEp.map(({ name }) => name);

    return {
      totalMembers: this.totalMembers,
      membersList,
      zeroActivityList: Array.from(this.zeroActivityList),
      lowActivityList: Array.from(this.lowActivityList),
    };
  }

  get socialMediaData(): ChapterPerformanceReport['socialMedia'] {
    return {
      totalPosts: this.totalPosts,
      avgPostsPerMember: this.avgPostsPerMember,
      avgRoundsOfPosts: this.avgRoundsOfPosts,
    };
  }

  get referralsAndBusinessBucksData(): ChapterPerformanceReport['referralsAndBusinessBucks'] {
    const referrals = this.referrers.reduce((acc, { referrals }) => acc + referrals, 0);
    const businessBucks = this.businessBucksReceivers.reduce((acc, { businessBucks }) => acc + businessBucks, 0);
    const referrers = this.referrers.map(({ name }) => name);
    const businessBucksReceivers = this.businessBucksReceivers.map(({ name }) => name);

    return { referrals, businessBucks, referrers, businessBucksReceivers };
  }
}
