export type ChapterPerformanceReport = {
  members: {
    totalMembers: number;
    zeroActivity: number;
    lowActivity: number;
    membersList: string[];
    zeroActivityList: string[];
    lowActivityList: string[];
  };
  socialMedia: {
    totalPosts: number;
    avgPostsPerMember: number;
    avgRoundsOfPosts: {
      raw: number;
      rounded: number;
    };
  };
  sessions: {
    total: number;
    activity: number;
    coaching: number;
    superGroups: number;
    visitor: number;
    mno: number;
    quick: number;
    unknown: number;
    membersSubmitted: number;
    submittedBy: string[];
  };
  events: {
    total: number;
    training: number;
    seminar: number;
    mixer: number;
    show: number;
    openMic: number;
    promoParty: number;
    other: number;
    listeningViewing: number;
    membersSubmitted: number;
    submittedBy: string[];
  };
  referralsAndBusinessBucks: {
    referrals: number;
    businessBucks: number;
  };
};

export type EventActivity = {
  attendingMember: string;
  attendingMemberName: string;
  eventBy: string;
  eventType: string;
};

export type MemberActivity = {
  firstName: string;
  lastName: string;
  name: string;
  sessions: number;
  referrals: number;
  businessBucks: number;
  eventAttendance: number;
  posts: number;
  visitors: number;
  total: number;
};

export type SessionActivity = {
  submittedBy: string;
  submittedByName: string;
  sessionWith: string;
  type: string;
};
