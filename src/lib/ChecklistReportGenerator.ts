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
      `Checklists Created: ${totalChecklists} (${checklistPercentage}%)`,
      `Checklists Missing: ${membersList.length - totalChecklists} (${missingChecklistPercentage}%)`,
    ].join('\n');
  }

  get report() {
    const lines: string[] = ['\n', '\n', '📣 Weekly Checklist Report\n', this.membersSubReport];

    return dedent`${lines.join('')}`;
  }

  get unblindedReport() {
    const { membersList, submittedBy } = this._reportData;

    const checklistSubmitters = submittedBy.length ? submittedBy.join(', ') : 'None';
    const missingChecklists = membersList.filter(member => !submittedBy.includes(member));

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
