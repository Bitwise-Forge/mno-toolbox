import EventDataProcessor from '@/lib/processors/EventDataProcessor';
import MemberDataProcessor from '@/lib/processors/MemberDataProcessor';
import SessionDataProcessor from '@/lib/processors/SessionDataProcessor';
import WeeklyChecklistProcessor from '@/lib/processors/WeeklyChecklistProcessor';
import ChapterReportGenerator from '@/lib/reportGenerators/ChapterReportGenerator';
import ChecklistReportGenerator from './lib/reportGenerators/ChecklistReportGenerator';

const generateChapterReport = async () => {
  const memberDataProcessor = new MemberDataProcessor();
  const sessionDataProcessor = new SessionDataProcessor();
  const eventDataProcessor = new EventDataProcessor();

  await Promise.all([memberDataProcessor.init(), sessionDataProcessor.init(), eventDataProcessor.init()]);

  const members = memberDataProcessor.memberReportData;
  const socialMedia = memberDataProcessor.socialMediaData;
  const sessions = sessionDataProcessor.sessionReportData;
  const events = eventDataProcessor.eventReportData;
  const referralsAndBusinessBucks = memberDataProcessor.referralsAndBusinessBucksData;
  const chapterReportGenerator = new ChapterReportGenerator({ members, socialMedia, sessions, events, referralsAndBusinessBucks });

  console.log(chapterReportGenerator.report);
  console.log(chapterReportGenerator.unblindedReport);
};

const generateChecklistReport = async () => {
  const weeklyChecklistProcessor = new WeeklyChecklistProcessor();
  await weeklyChecklistProcessor.init();

  const checklistReportGenerator = new ChecklistReportGenerator(weeklyChecklistProcessor.weeklyChecklistReport);

  console.log(checklistReportGenerator.report);
  console.log(checklistReportGenerator.unblindedReport);
};

const main = async () => {
  const reportType = process.argv[2];

  if (!reportType) {
    console.error('Please provide a report type (chapter or checklist) as an argument');
    return;
  }

  if (reportType === 'chapter') {
    await generateChapterReport();
    return;
  }

  await generateChecklistReport();
};

main().catch(error => console.error(error));
