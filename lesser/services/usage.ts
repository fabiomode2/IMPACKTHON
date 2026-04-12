import { ref, onValue, Unsubscribe, get } from 'firebase/database';
import { rtdb } from './firebase';

export interface CalendarDay {
  date: Date;
  usageMinutes: number;
}

export interface UsageStats {
  streakDays: number;
  topPercentage: number;
  hours24h: number;
  hoursWeek: number;
  hoursMonth: number;
  hours6Months: number;
  calendarData: CalendarDay[];

  rawUsage: Record<string, { totalMinutes: number; apps?: Record<string, number> }>;
}

export type UsageSummary = UsageStats; // Alias for backward compatibility if needed



/**
 * Helper to get a stable YYYY-MM-DD string based on LOCAL time.
 * Prevents the 1-day offset caused by UTC toISOString().
 */
export function formatLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Processes raw user data from Firebase into a UsageStats object.
 */
function processUsageSnapshot(data: any): UsageStats {
  const dailyUsage = data.daily_usage || {};
  const now = new Date();
  const todayStr = formatLocalISO(now);

  // 1. Calculate totals for different windows
  const getTotalMinutes = (days: number) => {
    let total = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = formatLocalISO(d);
      total += dailyUsage[dStr]?.totalMinutes || 0;
    }
    return total / 60; // Return in hours
  };

  const hours24h = (dailyUsage[todayStr]?.totalMinutes || 0) / 60;
  const hoursWeek = getTotalMinutes(7);
  const hoursMonth = getTotalMinutes(30);
  const hours6Months = getTotalMinutes(180);

  // 2. Generate 35 days for the GithubCalendar
  const calendarData: CalendarDay[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = formatLocalISO(d);
    calendarData.push({
      date: d,
      usageMinutes: dailyUsage[dStr]?.totalMinutes || 0
    });
  }

  // Cálculo de la racha
  const GOAL_MINUTES = data.goalMinutes || 240; 
  let computedStreak = 0;

  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = formatLocalISO(d);
    const usageMinutes = dailyUsage[dStr]?.totalMinutes || 0;

    if (usageMinutes > GOAL_MINUTES) {
      computedStreak = i + 1;
      break;
    } else if (!dailyUsage[dStr] && i > 0) {
      computedStreak = i;
    }
  }

  return {
    streakDays: computedStreak,
    topPercentage: data.topPercentage ?? 50,
    hours24h,
    hoursWeek,
    hoursMonth,
    hours6Months,
    calendarData,
    rawUsage: dailyUsage
  };
}

/**
 * One-off fetch of usage statistics.
 */
export async function fetchUsageStats(uid: string): Promise<UsageStats> {
  const userRef = ref(rtdb, `users/${uid}`);
  const snapshot = await get(userRef);
  return processUsageSnapshot(snapshot.val() || {});
}

/**
 * Subscribes to time-based usage statistics in real-time.
 */
export function subscribeToUsageData(
  uid: string,
  callback: (stats: UsageStats) => void
): Unsubscribe {
  const userRef = ref(rtdb, `users/${uid}`);

  return onValue(userRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(processUsageSnapshot(data));
  });
}
