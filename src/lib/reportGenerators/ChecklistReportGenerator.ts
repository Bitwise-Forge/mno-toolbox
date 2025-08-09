import dayjs from 'dayjs';

import type { WeeklyChecklistReport } from '@/interfaces';
import { dedent } from '@/utils/stringUtils';

export default class ChecklistReportGenerator {
  private _reportData: WeeklyChecklistReport;

  constructor(reportData: WeeklyChecklistReport) {
    this._reportData = reportData;
  }

  private get membersSubReport(): string {
    const { checklistPercentage, membersList, totalChecklists } = this._reportData;
    const missingChecklistPercentage = 100 - checklistPercentage;

    return [
      `Total Members: ${membersList.length}`,
      `Weekly Checklists Created: ${totalChecklists} (${checklistPercentage}%)`,
      `Weekly Checklists Missing: ${membersList.length - totalChecklists} (${missingChecklistPercentage}%)`,
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
    const { membersList, submittedBy } = this._reportData;

    const members = membersList.length ? membersList.join(', ') : 'None';
    const checklistSubmitters = submittedBy.length ? submittedBy.join(', ') : 'None';
    const missingChecklistsArr = membersList.filter(member => !submittedBy.includes(member));
    const missingChecklists = missingChecklistsArr.length ? missingChecklistsArr.join(', ') : 'None';

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
      missingChecklists,
    ];

    return dedent`${lines.join('')}`;
  }
}
