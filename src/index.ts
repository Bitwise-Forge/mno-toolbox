import type { ChapterPerformanceReport, EventRecord, MemberActivity, SessionRecord } from './interfaces';
import eventsData from './resources/events.json';
import membersData from './resources/members.json';
import sessionsData from './resources/sessions.json';
import { dedent } from './utils/stringUtils';

const members = membersData as MemberActivity[];
const sessions = sessionsData as SessionRecord[];
const events = eventsData as EventRecord[];

const emptyReport: ChapterPerformanceReport = {
  members: {
    totalMembers: 0,
    zeroActivity: 0,
    lowActivity: 0,
  },
  socialMedia: {
    totalPosts: 0,
    avgPostsPerMember: 0,
    avgRoundsOfPosts: {
      raw: 0,
      rounded: 0,
    },
  },
  sessions: {
    total: 0,
    activity: 0,
    coaching: 0,
    superGroups: 0,
    quick: 0,
    mno: 0,
    visitor: 0,
    unknown: 0,
    membersSubmitted: 0,
  },
  trainings: {
    count: 0,
  },
  referralsAndBusinessBucks: {
    referrals: 0,
    businessBucks: 0,
  },
};

const removeExecutiveProducer = (members: MemberActivity[]) =>
  new Set(members.filter(({ first_name, last_name }) => !`${first_name} ${last_name}`.startsWith('Executive Producer')));

const getMembersSection = () => {
  const uniqueMembers = removeExecutiveProducer(members);

  const totalMembers = uniqueMembers.size;
  const zeroActivityList = new Set<string>();
  const lowActivityList = new Set<string>();

  Array.from(uniqueMembers).forEach(member => {
    const { business_bucks, event_attendance, posts, referrals, sessions, visitors } = member;
    const activity = sessions + referrals + event_attendance + posts + visitors + (business_bucks ?? 0);

    if (activity === 0) {
      zeroActivityList.add(`${member.first_name} ${member.last_name[0]}.`);
      return;
    }

    if (activity === 1) {
      lowActivityList.add(`${member.first_name} ${member.last_name[0]}.`);
    }
  });

  return {
    totalMembers,
    zeroActivity: zeroActivityList.size,
    lowActivity: lowActivityList.size,
    zeroActivityList: Array.from(zeroActivityList),
    lowActivityList: Array.from(lowActivityList),
  };
};

const getSocialMediaSection = () => {
  const uniqueMembers = removeExecutiveProducer(members);

  const totalPosts = Array.from(uniqueMembers).reduce((acc, member) => acc + member.posts, 0);
  const avgPostsPerMember = Number.parseFloat((totalPosts / uniqueMembers.size).toFixed(2));
  const avgRoundsOfPosts = {
    raw: Number.parseFloat((avgPostsPerMember / uniqueMembers.size).toFixed(2)),
    rounded: Math.floor(avgPostsPerMember / uniqueMembers.size),
  };

  return { totalPosts, avgPostsPerMember, avgRoundsOfPosts };
};

const getReferralsAndBusinessBucksSection = () => {
  const totalReferrals = members.reduce((acc, member) => acc + member.referrals, 0);
  const totalBusinessBucks = members.reduce((acc, member) => acc + (member.business_bucks ?? 0), 0);

  return { referrals: totalReferrals, businessBucks: totalBusinessBucks };
};

const getSessionsSection = (): ChapterPerformanceReport['sessions'] => {
  const validSessions = sessions.filter(session => {
    const { receiver, type } = session;

    const isLeadershipSession = type.toLowerCase().startsWith('leadership');
    const isVisitorSession = type.toLowerCase().startsWith('visitor');
    const isWithExecutiveProducer = receiver.toLowerCase().startsWith('executive producer');

    if (isLeadershipSession) return false;
    if (isWithExecutiveProducer && !isVisitorSession) return false;

    return true;
  });

  const counts = {
    activity: 0,
    coaching: 0,
    superGroups: 0,
    visitor: 0,
    mno: 0,
    quick: 0,
    unknown: 0,
  };

  validSessions.forEach(({ type }) => {
    switch (type.toLowerCase().split(' ')[0]) {
      case 'activity':
        counts.activity++;
        break;
      case 'coaching':
        counts.coaching++;
        break;
      case 'supergroups':
        counts.superGroups++;
        break;
      case 'visitor':
        counts.visitor++;
        break;
      case 'mno':
        counts.mno++;
        break;
      case 'quick':
        counts.quick++;
        break;
      default:
        counts.unknown++;
        break;
    }
  });

  const membersSubmitted = new Set(
    validSessions.map(({ sender }) => {
      const [first_name, last_name] = sender.split(' ');
      return `${first_name} ${last_name[0]}.`;
    }),
  );

  return {
    total: validSessions.length,
    ...counts,
    membersSubmitted: membersSubmitted.size,
    submittedBy: Array.from(membersSubmitted),
  };
};

const getTrainingsSection = () => {
  const trainings = events.filter(
    ({ sender, type }) => type.toLowerCase() === 'training' && !sender.toLowerCase().startsWith('executive producer'),
  );

  const attendees = new Set(
    trainings.map(({ sender }) => {
      const [first_name, last_name] = sender.split(' ');
      return `${first_name} ${last_name[0]}.`;
    }),
  );

  return { count: trainings.length, attendees: Array.from(attendees) };
};

const generateReport = () => {
  const report: ChapterPerformanceReport = emptyReport;

  report.members = getMembersSection();
  report.socialMedia = getSocialMediaSection();
  report.referralsAndBusinessBucks = getReferralsAndBusinessBucksSection();
  report.sessions = getSessionsSection();
  report.trainings = getTrainingsSection();

  return report;
};

const formatReport = (report: ChapterPerformanceReport) => {
  const { members, referralsAndBusinessBucks, sessions, socialMedia, trainings } = report;
  const { lowActivity, totalMembers, zeroActivity } = members;
  const { businessBucks, referrals } = referralsAndBusinessBucks;
  const { activity, coaching, membersSubmitted, mno, quick, superGroups, total, unknown, visitor } = sessions;
  const { avgPostsPerMember, avgRoundsOfPosts, totalPosts } = socialMedia;

  const membersSubReport = `Total Members: ${totalMembers}
    Zero Activity: ${zeroActivity}
    Low Activity: ${lowActivity}`;

  const socialMediaSubReport = `Total Posts: ${totalPosts}
    Avg Posts per Member: ${avgPostsPerMember}
    Avg Rounds of Posts: ${avgRoundsOfPosts.raw} → ${avgRoundsOfPosts.rounded}`;

  const sessionTypeSubReport = [
    { type: 'Activity', count: activity },
    { type: 'Coaching', count: coaching },
    { type: 'MNO', count: mno },
    { type: 'Quick', count: quick },
    { type: 'Supergroups', count: superGroups },
    { type: 'Visitor', count: visitor },
    { type: 'Unknown', count: unknown },
  ]
    .filter(({ count }) => count > 0)
    .map(({ count, type }) => `    ${type}: ${count}`)
    .join('\n');

  const sessionsSubReport = dedent`Total Sessions: ${total}
${sessionTypeSubReport}
    Members Who Submitted Sessions: ${membersSubmitted}`;

  const trainingsSubReport = `Trainings Recorded: ${trainings.count}`;

  const referralsAndBusinessBucksSubReport = `Referrals: ${referrals}
    Business Bucks: ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(businessBucks)}`;

  return dedent`
    📣 Weekly Chapter Performance Report
    ${membersSubReport}

    💬 Social Media
    ${socialMediaSubReport}

    🤝 Sessions
    ${sessionsSubReport}

    🎓 Trainings
    ${trainingsSubReport}

    💰 Referrals + Business Bucks
    ${referralsAndBusinessBucksSubReport}
  `;
};

const formatUnblindedReport = (report: ChapterPerformanceReport) => {
  const { members, sessions, trainings } = report;
  const { lowActivityList, zeroActivityList } = members;
  const { submittedBy } = sessions;
  const { attendees: trainingsAttendees } = trainings;

  const zeroActivityMembers = zeroActivityList?.length ? zeroActivityList.join('\n') : 'None';
  const lowActivityMembers = lowActivityList?.length ? lowActivityList.join('\n') : 'None';
  const sessionSubmitters = submittedBy?.length ? submittedBy.join('\n') : 'None';
  const trainingAttendees = trainingsAttendees?.length ? trainingsAttendees.join('\n') : 'None';

  return dedent`Zero Activity Members:
${zeroActivityMembers}

Low Activity Members:
${lowActivityMembers}

Session Submitters:
${sessionSubmitters}

Training Attendees:
${trainingAttendees}`;
};

const main = () => {
  const report = generateReport();

  console.log(formatReport(report));
  console.log('\n🔍 Unblinded Data:');
  console.log(formatUnblindedReport(report));
};

main();
