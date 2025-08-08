import EventDataProcessor from '@/lib/EventDataProcessor';
import MemberDataProcessor from '@/lib/MemberDataProcessor';
import ReportGenerator from '@/lib/ReportGenerator';
import SessionDataProcessor from '@/lib/SessionDataProcessor';

const main = async () => {
  const memberDataProcessor = new MemberDataProcessor();
  const sessionDataProcessor = new SessionDataProcessor();
  const eventDataProcessor = new EventDataProcessor();

  await Promise.all([memberDataProcessor.init(), sessionDataProcessor.init(), eventDataProcessor.init()]);

  const members = memberDataProcessor.memberReportData;
  const socialMedia = memberDataProcessor.socialMediaData;
  const sessions = sessionDataProcessor.sessionReportData;
  const events = eventDataProcessor.eventReportData;
  const referralsAndBusinessBucks = memberDataProcessor.referralsAndBusinessBucksData;
  const reportGenerator = new ReportGenerator({ members, socialMedia, sessions, events, referralsAndBusinessBucks });

  console.log(reportGenerator.report);
  console.log(reportGenerator.unblindedReport);
};

main().catch(error => console.error(error));
