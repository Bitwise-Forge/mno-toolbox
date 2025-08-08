import dayjs from 'dayjs';

import type { ChapterPerformanceReport } from '@/interfaces';
import { dedent } from '@/utils/stringUtils';

export default class ChapterReportGenerator {
  private _reportData: ChapterPerformanceReport;

  constructor(reportData: ChapterPerformanceReport) {
    this._reportData = reportData;
  }

  private get membersSubReport(): string {
    const { members } = this._reportData;
    const { lowActivity, totalMembers, zeroActivity } = members;

    return [`Total Members: ${totalMembers}`, `Zero Activity: ${zeroActivity}`, `Low Activity: ${lowActivity}`].join('\n');
  }

  private get socialMediaSubReport(): string {
    const { socialMedia } = this._reportData;
    const { avgPostsPerMember, avgRoundsOfPosts, totalPosts } = socialMedia;

    return [
      `Total Posts: ${totalPosts}`,
      `Avg Posts per Member: ${avgPostsPerMember}`,
      `Avg Rounds of Posts: ${avgRoundsOfPosts.raw} → ${avgRoundsOfPosts.rounded}`,
    ].join('\n');
  }

  private get sessionsSubReport(): string {
    const { sessions } = this._reportData;
    const { activity, coaching, mno, quick, superGroups, total, unknown, visitor } = sessions;

    const sessionTypeSubReport = [
      { type: 'Activity', count: activity },
      { type: 'Coaching', count: coaching },
      { type: 'MNO', count: mno },
      { type: 'Quick', count: quick },
      { type: 'Supergroups', count: superGroups },
      { type: 'Visitor', count: visitor },
      { type: 'Unknown', count: unknown },
    ];

    const populatedSessionTypes = sessionTypeSubReport.filter(({ count }) => count > 0).map(({ count, type }) => `${type}: ${count}`);

    return [`Total Sessions: ${total}`, ...populatedSessionTypes].join('\n');
  }

  private get eventsSubReport(): string {
    const { events } = this._reportData;
    const { listeningViewing, mixer, openMic, other, promoParty, seminar, show, total, training } = events;

    const eventTypeSubReport = [
      { type: 'Training', count: training },
      { type: 'Seminar', count: seminar },
      { type: 'Mixer', count: mixer },
      { type: 'Show', count: show },
      { type: 'Open Mic', count: openMic },
      { type: 'Promo Party', count: promoParty },
      { type: 'Other', count: other },
      { type: 'Listening/Viewing', count: listeningViewing },
    ];

    const populatedEventTypes = eventTypeSubReport.filter(({ count }) => count > 0).map(({ count, type }) => `${type}: ${count}`);

    return [`Total Events: ${total}`, ...populatedEventTypes].join('\n');
  }

  private get referralsAndBusinessBucksSubReport(): string {
    const { referralsAndBusinessBucks } = this._reportData;
    const { businessBucks, referrals } = referralsAndBusinessBucks;

    return [`Referrals: ${referrals}`, `Business Bucks: ${businessBucks}`].join('\n');
  }

  get report() {
    const reportDate = dayjs().format('MM/DD/YYYY hh:mm A');
    const lines: string[] = [
      '\n',
      '\n',
      `📣 Weekly Chapter Performance Report (as of ${reportDate})\n`,
      this.membersSubReport,
      '\n',
      '\n',
      '💬 Social Media\n',
      this.socialMediaSubReport,
      '\n',
      '\n',
      '🤝 Sessions\n',
      this.sessionsSubReport,
      '\n',
      '\n',
      '🎟️  Events\n',
      this.eventsSubReport,
      '\n',
      '\n',
      '💰 Referrals + Business Bucks\n',
      this.referralsAndBusinessBucksSubReport,
    ];

    return dedent`${lines.join('')}`;
  }

  get unblindedReport() {
    const { events, members, sessions } = this._reportData;
    const { lowActivityList, zeroActivityList } = members;
    const { submittedBy: sessionSubmittedBy } = sessions;
    const { submittedBy: eventsSubmittedBy } = events;

    const membersList = members.membersList.length ? members.membersList.join(', ') : 'None';
    const zeroActivityMembers = zeroActivityList.length ? zeroActivityList.join(', ') : 'None';
    const lowActivityMembers = lowActivityList.length ? lowActivityList.join(', ') : 'None';
    const sessionSubmitters = sessionSubmittedBy.length ? sessionSubmittedBy.join(', ') : 'None';
    const eventAttendees = eventsSubmittedBy.length ? eventsSubmittedBy.join(', ') : 'None';

    const lines = [
      '\n',
      '\n',
      '--------------------------------',
      '\n',
      '\n',
      '🔍 Unblinded Data:\n',
      'Members List:\n',
      membersList,
      '\n',
      '\n',
      'Zero Activity Members:\n',
      zeroActivityMembers,
      '\n',
      '\n',
      'Low Activity Members:\n',
      lowActivityMembers,
      '\n',
      '\n',
      'Session Submitters:\n',
      sessionSubmitters,
      '\n',
      '\n',
      'Event Attendees:\n',
      eventAttendees,
    ];

    return dedent`${lines.join('')}`;
  }
}
