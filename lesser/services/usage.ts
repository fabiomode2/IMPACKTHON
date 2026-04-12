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

    // Cálculo de la racha: hoy - último día que superó el objetivo + 1
    const GOAL_MINUTES = (data.goalMinutes); // Usa 4h por defecto si no tiene objetivo
    let computedStreak = 0;

    // Vamos hacia atrás en el calendario (hasta 365 días como límite de seguridad)
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = formatLocalISO(d);

      const usageMinutes = dailyUsage[dStr]?.totalMinutes || 0; // tiempo de uso de ese día

      if (usageMinutes > GOAL_MINUTES) {
        // 'i' es matemáticamente la diferencia de días (hoy - último_día). 
        // Sumamos + 1 como indicaste:
        computedStreak = i + 1;

        // (Nota: Si quieres que al fallar hoy la racha sea 0, en lugar de i + 1 deberás usar simplemente i)
        break;
      } else if (!dailyUsage[dStr] && i > 0) {
        // Opcional: si llegamos a fechas donde no hay registros (antes de que usara la app), 
        // paramos y la racha será todos los días desde ese entonces.
        computedStreak = i;
      }
    }

    callback({
      streakDays: computedStreak,
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
