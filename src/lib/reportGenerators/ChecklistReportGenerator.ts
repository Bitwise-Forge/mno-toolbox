import type { WeeklyChecklistReport } from '@/interfaces';
import dayjs from '@/lib/Dayjs';
import { formatDateWithTzSupport } from '@/utils/datetime';
import env from '@/utils/env';
import { getPercentage } from '@/utils/numberUtils';
import { dedent } from '@/utils/stringUtils';

export default class ChecklistReportGenerator {
  private _reportData: WeeklyChecklistReport;

  constructor(reportData: WeeklyChecklistReport) {
    this._reportData = reportData;
  }

  private get membersSubReport(): string {
    const { membersList, missingChecklists, total } = this._reportData;
    const hasChecklistPercentage = getPercentage(total, membersList.length);
    const missingChecklistsPercentage = getPercentage(missingChecklists.length, membersList.length);

    return [
      '👥 Chapter Members',
      `   - Total: ${membersList.length}`,
      `   - Weekly Checklists Created: ${total} (${hasChecklistPercentage}%)`,
      `   - Weekly Checklists Missing: ${missingChecklists.length} (${missingChecklistsPercentage}%)`,
    ].join('\n');
  }

  get report() {
    const reportDate = formatDateWithTzSupport(dayjs(), 'MM/DD/YYYY hh:mm A z');
    const weekStart = formatDateWithTzSupport(dayjs(env.REPORT_START_DATE), 'MM/DD/YYYY');
    const weekEnd = formatDateWithTzSupport(dayjs(env.REPORT_END_DATE), 'MM/DD/YYYY');
    const reportWeek = `(${weekStart} - ${weekEnd})`;

    const lines: string[] = [
      '\n',
      '\n',
      '--------------------------------',
      '\n',
      '\n',
      `📣 Chapter Weekly Checklist Report`,
      '\n',
      `      Generated on: ${reportDate}`,
      '\n',
      '\n',
      `📅 MNO Week: ${reportWeek}`,
      '\n',
      '\n',
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
      '🔍 Unblinded Data:',
      '\n',
      '\n',
      'Members List:',
      '\n',
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
