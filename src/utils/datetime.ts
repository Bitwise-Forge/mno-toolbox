import type { Dayjs } from 'dayjs';

import dayjs from '@/lib/Dayjs';

export const formatDateWithTzSupport = (date: Dayjs, format: string): string => dayjs(date).format(format);

export const isValidDate = (date?: string | number | Date | Dayjs): boolean => {
  if (!date) return false;
  return dayjs(date).isValid();
};
