import dayjs from 'dayjs';

import type { WeeklyChecklistReport } from '@/interfaces';
import { getPercentage } from '@/utils/numberUtils';
import { dedent } from '@/utils/stringUtils';

export default class ChecklistReportGenerator {
  private _reportData: WeeklyChecklistReport;

  constructor(reportData: WeeklyChecklistReport) {
    this._reportData = reportData;
  }

  private get membersSubReport(): string {
    const { membersList, missingChecklists, totalChecklists } = this._reportData;
    const hasChecklistPercentage = getPercentage(totalChecklists, membersList.length);
    const missingChecklistsPercentage = getPercentage(missingChecklists.length, membersList.length);

    return [
      `Total Members: ${membersList.length}`,
      `Weekly Checklists Created: ${totalChecklists} (${hasChecklistPercentage}%)`,
      `Weekly Checklists Missing: ${missingChecklists.length} (${missingChecklistsPercentage}%)`,
    ].join('\n');
  }

  get report() {
    const reportDate = dayjs().format('MM/DD/YYYY hh:mm A');
    const lines: string[] = [
      '\n',
      '\n',
      '--------------------------------',
      '\n',
      '\n',
      `📣 Weekly Checklist Report (as of ${reportDate})\n`,
      this.membersSubReport,
    ];

    return dedent`${lines.join('')}`;
  }

  get unblindedReport() {
    const { membersList, missingChecklists, submittedBy } = this._reportData;

    const members = membersList.length ? membersList.join(', ') : 'None';
    const checklistSubmitters = submittedBy.length ? submittedBy.join(', ') : 'None';
    const missingChecklistMembers = missingChecklists.length ? missingChecklists.join(', ') : 'None';

    const lines = [
      '\n',
      '\n',
      '--------------------------------',
      '\n',
      '\n',
      '🔍 Unblinded Data:\n',
      'Members List:\n',
      members,
      '\n',
      '\n',
      'Checklist Submitters:\n',
      checklistSubmitters,
      '\n',
      '\n',
      'Missing Checklists:\n',
      missingChecklistMembers,
    ];

    return dedent`${lines.join('')}`;
  }
}
