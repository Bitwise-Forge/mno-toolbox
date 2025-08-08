export type ChapterPerformanceReport = {
  members: {
    totalMembers: number;
    zeroActivity: number;
    lowActivity: number;
    zeroActivityList?: string[];
    lowActivityList?: string[];
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
    submittedBy?: string[];
  };
  trainings: {
    count: number;
    attendees?: string[];
  };
  referralsAndBusinessBucks: {
    referrals: number;
    businessBucks: number;
  };
};

export type EventRecord = {
  id: number;
  sender: string;
  receiver: string;
  type: string;
  date: string;
};

export type MemberActivity = {
  id: number;
  first_name: string;
  last_name: string;
  sessions: number;
  referrals: number;
  business_bucks: number | null;
  event_attendance: number;
  posts: number;
  visitors: number;
  total: number;
  attendance: string;
};

export type SessionRecord = {
  id: number;
  sender: string;
  receiver: string;
  type: string;
  date: string;
};
