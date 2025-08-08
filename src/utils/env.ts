import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

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
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PUPPETEER_HEADLESS_MODE: z
      .string()
      .transform(val => val === 'true')
      .default(false),
  },
  runtimeEnv: process.env,
});
