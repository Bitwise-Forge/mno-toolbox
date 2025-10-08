import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

import dayjs from '@/lib/Dayjs';
import { isValidDate } from '@/utils/datetime';

const stringToBooleanSchema = z.string().transform(val => val === 'true');
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(val => {
    const date = dayjs(val);
    return isValidDate(date) && dayjs(date).format('YYYY-MM-DD') === val;
  });

export default createEnv({
  emptyStringAsUndefined: true,
  server: {
    MNO_BASE_URL: z.url(),
    MNO_DASHBOARD_PATH: z.string().min(1),
    MNO_EVENT_REPORT_PATH: z.string().min(1),
    MNO_LOGIN_PATH: z.string().min(1),
    MNO_PASSWORD: z.string().min(1),
    MNO_SESSION_REPORT_PATH: z.string().min(1),
    MNO_SM_REPORT_PATH: z.string().min(1),
    MNO_USERNAME: z.email(),
    MNO_VISITORS_PATH: z.string().min(1),
    MNO_WEEKLY_CHECKLIST_PATH: z.string().min(1),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PUPPETEER_HEADLESS_MODE: stringToBooleanSchema,
    REPORT_START_DATE: dateSchema,
    REPORT_END_DATE: dateSchema,
  },
  runtimeEnv: process.env,
});
