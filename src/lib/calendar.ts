import { prisma } from "./prisma";

export interface DayStatus {
  isClosed: boolean;
  reason?: string;
}

/**
 * Checks if a specific date is a valid school day (not a weekend, not a holiday, and within academic year).
 */
export async function getDayStatus(date: Date): Promise<DayStatus> {
  const settings = await prisma.schoolSettings.findUnique({ where: { id: "default" } });
  
  if (!settings) return { isClosed: false };

  // 1. Check Academic Year bounds
  const checkDateStr = date.toISOString().split("T")[0];
  const checkDate = new Date(`${checkDateStr}T00:00:00Z`); // Normalize to UTC midnight

  if (settings.academicYearStart && checkDate < settings.academicYearStart) {
    return { isClosed: true, reason: "Outside Academic Year (Before Start)" };
  }
  if (settings.academicYearEnd && checkDate > settings.academicYearEnd) {
    return { isClosed: true, reason: "Outside Academic Year (After End)" };
  }

  // 2. Check Weekends (Saturday = 6, Sunday = 0)
  // We use getUTCDay() since checkDate is normalized to UTC midnight
  const dayOfWeek = checkDate.getUTCDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isClosed: true, reason: "Weekend" };
  }

  // 3. Check Holidays
  const holiday = await prisma.holiday.findUnique({
    where: { date: checkDate }
  });

  if (holiday) {
    return { isClosed: true, reason: `Holiday: ${holiday.name}` };
  }

  return { isClosed: false };
}

/**
 * Calculates the total number of required instructional days between start and end date.
 * Excludes weekends and any holidays.
 */
export async function getInstructionalDays(start: Date, end: Date): Promise<number> {
  // Normalize bounds to midnight UTC
  const startD = new Date(`${start.toISOString().split("T")[0]}T00:00:00Z`);
  const endD = new Date(`${end.toISOString().split("T")[0]}T00:00:00Z`);
  
  if (endD < startD) return 0;

  let totalWeekdays = 0;
  const current = new Date(startD);

  // Count raw weekdays (M-F)
  while (current <= endD) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) {
      totalWeekdays++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Subtract Holidays that fall within this range and are on weekdays
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: startD,
        lte: endD
      }
    }
  });

  let validHolidays = 0;
  for (const h of holidays) {
    const day = h.date.getUTCDay();
    if (day !== 0 && day !== 6) {
      validHolidays++;
    }
  }

  return Math.max(0, totalWeekdays - validHolidays);
}
