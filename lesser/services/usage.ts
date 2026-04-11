import { ref, onValue, Unsubscribe } from 'firebase/database';
import { rtdb } from './firebase';

export interface CalendarDay {
  date: Date;
  usageMinutes: number;
}

export interface UsageSummary {
  streakDays: number;
  topPercentage: number;
  hours24h: number;
  hoursWeek: number;
  hoursMonth: number;
  hours6Months: number;
  calendarData: CalendarDay[];

  rawUsage: Record<string, { totalMinutes: number; apps?: Record<string, number> }>;
}



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
 * Subscribes to time-based usage statistics in real-time.

 * Aggregates data for the 24h, 7d, and 30d bars + the 35-day consistency map.
 */
export function subscribeToUsageData(
  uid: string,
  callback: (summary: UsageSummary) => void
): Unsubscribe {
  const userRef = ref(rtdb, `users/${uid}`);

  return onValue(userRef, (snapshot) => {
    const data = snapshot.val() || {};
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


    callback({
      streakDays: data.streakDays ?? 0,
      topPercentage: data.topPercentage ?? 50,
      hours24h,
      hoursWeek,
      hoursMonth,
      hours6Months,
      calendarData,

      rawUsage: dailyUsage
    });


  });
}
