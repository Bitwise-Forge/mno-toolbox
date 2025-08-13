import type { WeeklyChecklistReport } from '@/interfaces';

export const mockChecklistReportData: WeeklyChecklistReport = {
  total: 15,
  submittedBy: ['John Doe', 'Jane Smith', 'Bob Johnson'],
  missingChecklists: ['Alice Brown', 'Charlie Wilson'],
  membersList: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'],
};

export const mockEmptyChecklistData: WeeklyChecklistReport = {
  total: 0,
  submittedBy: [],
  missingChecklists: [],
  membersList: [],
};

export const mockZeroChecklistsData: WeeklyChecklistReport = {
  total: 0,
  submittedBy: [],
  missingChecklists: ['John Doe', 'Jane Smith', 'Bob Johnson'],
  membersList: ['John Doe', 'Jane Smith', 'Bob Johnson'],
};

export const mockAllChecklistsData: WeeklyChecklistReport = {
  total: 3,
  submittedBy: ['John Doe', 'Jane Smith', 'Bob Johnson'],
  missingChecklists: [],
  membersList: ['John Doe', 'Jane Smith', 'Bob Johnson'],
};

export const mockSingleMemberData: WeeklyChecklistReport = {
  total: 1,
  submittedBy: ['John Doe'],
  missingChecklists: [],
  membersList: ['John Doe'],
};

export const mockAllMissingData: WeeklyChecklistReport = {
  total: 0,
  submittedBy: [],
  missingChecklists: ['John Doe', 'Jane Smith', 'Bob Johnson'],
  membersList: ['John Doe', 'Jane Smith', 'Bob Johnson'],
};

export const mockLargeData: WeeklyChecklistReport = {
  total: 999999,
  submittedBy: Array.from({ length: 1000 }, (_, i) => `Member${i}`),
  missingChecklists: [],
  membersList: Array.from({ length: 1000 }, (_, i) => `Member${i}`),
};

export const mockSpecialCharactersData: WeeklyChecklistReport = {
  total: 2,
  submittedBy: ['John-Doe', 'Jane_Smith', 'Bob@Johnson'],
  missingChecklists: ['Alice-Brown', 'Charlie_Wilson'],
  membersList: ['John-Doe', 'Jane_Smith', 'Bob@Johnson', 'Alice-Brown', 'Charlie_Wilson'],
};

export const mockUnicodeData: WeeklyChecklistReport = {
  total: 1,
  submittedBy: ['Jess Smith', 'Micheal Muller'],
  missingChecklists: [],
  membersList: ['Jess Smith', 'Micheal Muller'],
};
