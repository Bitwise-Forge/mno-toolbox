import type { Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import { load } from 'cheerio';

import type { ChapterPerformanceReport, MemberActivity } from '@/interfaces';
import { Scraper } from '@/lib/Scraper';

export default class MemberDataParser {
  private _scraper: Scraper;
  private _memberReportHtml: Cheerio<Element> | null;
  private _memberReportJson: MemberActivity[];

  constructor() {
    this._scraper = new Scraper('member');
    this._memberReportHtml = null;
    this._memberReportJson = [];
  }

  async init(): Promise<void> {
    await this._scraper.init();
    this._memberReportHtml = await this._scraper.getSmReport();
    await this._scraper.close();
    this.parse();
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

      this._memberReportJson.push(memberActivity);
    });

    console.log(`Successfully parsed ${this._memberReportJson.length} members from table`);
  }

  private get uniqueMembersMinusEp(): MemberActivity[] {
    return Array.from(new Set(this._memberReportJson.filter(({ name }) => !name.toLowerCase().startsWith('executive'))));
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
    return Number.parseFloat((this.totalPosts / this.totalMembers).toFixed(2));
  }

  private get avgRoundsOfPosts(): { raw: number; rounded: number } {
    return {
      raw: Number.parseFloat((this.avgPostsPerMember / this.totalMembers).toFixed(2)),
      rounded: Math.floor(this.avgPostsPerMember / this.totalMembers),
    };
  }

  private get totalReferrals(): number {
    return this._memberReportJson.reduce((acc, member) => acc + member.referrals, 0);
  }

  private get totalBusinessBucks(): number {
    return this._memberReportJson.reduce((acc, member) => acc + member.businessBucks, 0);
  }

  get memberReportData(): ChapterPerformanceReport['members'] {
    return {
      totalMembers: this.totalMembers,
      zeroActivity: this.zeroActivityList.size,
      lowActivity: this.lowActivityList.size,
      membersList: this.uniqueMembersMinusEp.map(({ name }) => name),
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
    return {
      referrals: this.totalReferrals,
      businessBucks: this.totalBusinessBucks,
    };
  }
}
