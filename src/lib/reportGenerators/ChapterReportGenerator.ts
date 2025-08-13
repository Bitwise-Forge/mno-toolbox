import dayjs from 'dayjs';

import type { ChapterPerformanceReport } from '@/interfaces';
import { getPercentage } from '@/utils/numberUtils';
import { dedent } from '@/utils/stringUtils';

export default class ChapterReportGenerator {
  private _reportData: ChapterPerformanceReport;

  constructor(reportData: ChapterPerformanceReport) {
    this._reportData = reportData;
  }

  private get membersSubReport(): string {
    const { lowActivityList, totalMembers, zeroActivityList } = this._reportData.members;

    const activityLists = [
      { type: 'Zero Activity', count: zeroActivityList.length },
      { type: 'Low Activity', count: lowActivityList.length },
    ]
      .filter(({ count }) => count > 0)
      .map(({ count, type }) => ` - ${type}: ${count} (${getPercentage(count, totalMembers)}%)`);

    return [`Total Members: ${totalMembers}`, ...activityLists].join('\n');
  }

  private get socialMediaSubReport(): string {
    const { avgPostsPerMember, avgRoundsOfPosts, totalPosts } = this._reportData.socialMedia;

    return [
      `Total Posts: ${totalPosts}`,
      ` - Avg. Posts per Member: ${avgPostsPerMember}`,
      ` - Avg. Rounds of Posts: ${avgRoundsOfPosts.raw} → ${avgRoundsOfPosts.rounded}`,
    ].join('\n');
  }

  private get sessionsSubReport(): string {
    const { activity, coaching, mno, quick, superGroups, total, unknown, visitor } = this._reportData.sessions;

    const sessionTypeSubReport = [
      { type: 'Activity', count: activity },
      { type: 'Coaching', count: coaching },
      { type: 'MNO', count: mno },
      { type: 'Quick', count: quick },
      { type: 'Supergroups', count: superGroups },
      { type: 'Unknown', count: unknown },
      { type: 'Visitor', count: visitor },
    ];

    const populatedSessionTypes = sessionTypeSubReport
      .filter(({ count }) => count > 0)
      .map(({ count, type }) => ` - ${type}: ${count}`);

    return [`Total Sessions: ${total}`, ...populatedSessionTypes].join('\n');
  }

  private get eventsSubReport(): string {
    const { listeningViewing, mixer, openMic, other, promoParty, seminar, show, total, training } = this._reportData.events;

    const eventTypeSubReport = [
      { type: 'Listening/Viewing', count: listeningViewing },
      { type: 'Mixer', count: mixer },
      { type: 'Open Mic', count: openMic },
      { type: 'Other', count: other },
      { type: 'Promo Party', count: promoParty },
      { type: 'Seminar', count: seminar },
      { type: 'Show', count: show },
      { type: 'Training', count: training },
    ];

    const populatedEventTypes = eventTypeSubReport.filter(({ count }) => count > 0).map(({ count, type }) => ` - ${type}: ${count}`);
    return [`Total Events: ${total}`, ...populatedEventTypes].join('\n');
  }

  private get referralsAndBusinessBucksSubReport(): string {
    const { businessBucks, referrals } = this._reportData.referralsAndBusinessBucks;

    return [`Referrals: ${referrals}`, `Business Bucks: ${businessBucks}`].join('\n');
  }

  get report() {
    const reportDate = dayjs().format('MM/DD/YYYY hh:mm A');
    const lines = [
      '\n',
      '\n',
      '--------------------------------',
      '\n',
      '\n',
      `📣 Weekly Chapter Performance Report (as of ${reportDate})`,
      '\n',
      '\n',
      this.membersSubReport,
      '\n',
      '\n',
      '💬 Social Media',
      '\n',
      this.socialMediaSubReport,
      '\n',
      '\n',
      '🤝 Sessions',
      '\n',
      this.sessionsSubReport,
      '\n',
      '\n',
      '🎟️  Events',
      '\n',
      this.eventsSubReport,
      '\n',
      '\n',
      '💰 Referrals + Business Bucks',
      '\n',
      this.referralsAndBusinessBucksSubReport,
    ];

    return dedent`${lines.join('')}`;
  }

  get unblindedReport() {
    const { events, members, referralsAndBusinessBucks, sessions } = this._reportData;
    const { lowActivityList, zeroActivityList } = members;
    const { submittedBy: sessionSubmittedBy } = sessions;
    const { submittedBy: eventsSubmittedBy } = events;
    const { businessBucksReceivers, referrers } = referralsAndBusinessBucks;

    const membersList = members.membersList.length ? members.membersList.join(', ') : 'None';
    const zeroActivityMembers = zeroActivityList.length ? zeroActivityList.join(', ') : 'None';
    const lowActivityMembers = lowActivityList.length ? lowActivityList.join(', ') : 'None';
    const sessionSubmitters = sessionSubmittedBy.length ? sessionSubmittedBy.join(', ') : 'None';
    const eventAttendees = eventsSubmittedBy.length ? eventsSubmittedBy.join(', ') : 'None';
    const referralsList = referrers.length ? referrers.join(', ') : 'None';
    const businessBucksList = businessBucksReceivers.length ? businessBucksReceivers.join(', ') : 'None';

    const lines = [
      '\n',
      '\n',
      '--------------------------------',
      '\n',
      '\n',
      '🔍 Unblinded Data:',
      '\n',
      '\n',
      'Members List:',
      '\n',
      membersList,
      '\n',
      '\n',
      'Zero Activity Members:',
      '\n',
      zeroActivityMembers,
      '\n',
      '\n',
      'Low Activity Members:',
      '\n',
      lowActivityMembers,
      '\n',
      '\n',
      'Session Submitters:',
      '\n',
      sessionSubmitters,
      '\n',
      '\n',
      'Event Attendees:',
      '\n',
      eventAttendees,
      '\n',
      '\n',
      'Referrals:',
      '\n',
      referralsList,
      '\n',
      '\n',
      'Business Bucks:',
      '\n',
      businessBucksList,
    ];

    return dedent`${lines.join('')}`;
  }
}
