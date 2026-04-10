/**
 * services/usage.ts
 *
 * Firebase-ready Usage Data Service.
 * Currently returns mock data. Replace implementations with Firestore calls.
 *
 * Firebase integration points are marked with: // [FIREBASE]
 */

export interface DayUsage {
  date: Date;
  usageMinutes: number;
}

export interface AppUsage {
  name: string;
  usageTime: number; // in minutes
  icon: string;
}

export interface UsageStats {
  streakDays: number;
  hours24h: number;
  topPercentage: number;
  calendarData: DayUsage[];
  mostUsedApps: AppUsage[];
}

/**
 * Fetch usage statistics for a given user.
 * Replace with Firestore query to the user's usage subcollection.
 */
export async function fetchUsageStats(_uid: string): Promise<UsageStats> {
  // [FIREBASE] const doc = await getDoc(doc(db, 'users', uid, 'stats', 'summary'));
  // [FIREBASE] return doc.data() as UsageStats;

  // Mock data
  await new Promise(r => setTimeout(r, 100));
  return {
    streakDays: 15,
    hours24h: 3.5,
    topPercentage: 15,
    calendarData: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      usageMinutes: Math.floor(Math.random() * 140),
    })),
    mostUsedApps: [
      { name: 'Instagram', usageTime: 120, icon: 'camera' },
      { name: 'TikTok', usageTime: 95, icon: 'music-note' },
      { name: 'WhatsApp', usageTime: 60, icon: 'message-square' },
      { name: 'YouTube', usageTime: 45, icon: 'tv' },
      { name: 'Twitter/X', usageTime: 30, icon: 'message-circle' },
    ],
  };
}

/**
 * Log a session of app usage.
 * Replace with Firestore write.
 */
export async function logUsageSession(_uid: string, _appName: string, _minutes: number): Promise<void> {
  // [FIREBASE] await addDoc(collection(db, 'users', uid, 'sessions'), { appName, minutes, timestamp: serverTimestamp() });
}
