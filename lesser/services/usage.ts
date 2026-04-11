/**
 * services/usage.ts
 *
 * Usage service — real data from Android native module.
 * The public API is unchanged so the rest of the app doesn't break.
 */

import { NativeModules, Platform } from 'react-native';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const { AppUsageModule } = NativeModules;
const isAndroidNativeAvailable = Platform.OS === 'android' && AppUsageModule != null;

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check if the PACKAGE_USAGE_STATS permission has been granted.
 * Returns false if not on Android or module is unavailable.
 */
export async function checkUsagePermission(): Promise<boolean> {
  if (!isAndroidNativeAvailable) return false;
  try {
    return await AppUsageModule.checkPermission();
  } catch {
    return false;
  }
}

/**
 * Open Android Settings > Usage Access so the user can grant the permission.
 */
export async function requestUsagePermission(): Promise<void> {
  if (!isAndroidNativeAvailable) return;
  try {
    await AppUsageModule.requestPermission();
  } catch (e) {
    console.warn('[usage] requestUsagePermission failed', e);
  }
}

/**
 * Get total screen time across ALL apps today (midnight → now), in minutes.
 * Returns 0 if the permission is not granted or native module is unavailable.
 */
export async function getTotalDailyUsageMinutes(): Promise<number> {
  if (!isAndroidNativeAvailable) return 0;
  try {
    const granted = await AppUsageModule.checkPermission();
    if (!granted) return 0;
    return await AppUsageModule.getTotalDailyUsageMinutes();
  } catch (e) {
    console.error('[usage] getTotalDailyUsageMinutes error', e);
    return 0;
  }
}

/**
 * Get per-app usage list sorted by usage time descending.
 * Returns an empty array if not available.
 */
export async function getAppUsageList(): Promise<AppUsage[]> {
  if (!isAndroidNativeAvailable) return [];
  try {
    const granted = await AppUsageModule.checkPermission();
    if (!granted) return [];
    const raw: { name: string; usageTime: number }[] =
      await AppUsageModule.getDailyUsageStats();
    return raw
      .sort((a, b) => b.usageTime - a.usageTime)
      .map(app => ({ name: app.name, usageTime: app.usageTime, icon: 'app.fill' }));
  } catch (e) {
    console.error('[usage] getAppUsageList error', e);
    return [];
  }
}

// ─── Main fetch (Firebase profile + native usage) ─────────────────────────

/**
 * Fetch usage statistics for a given user.
 * - streakDays and topPercentage come from Firestore.
 * - hours24h comes from the native Android bridge (real data).
 * - calendarData is still stubbed (would need a Firestore subcollection to be real).
 */
export async function fetchUsageStats(uid: string): Promise<UsageStats> {
  const [userSnap, hours24h] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getTotalDailyUsageMinutes().then(min => min / 60),
  ]);

  const userData = userSnap.data();

  return {
    streakDays:    userData?.streakDays    ?? 0,
    hours24h,
    topPercentage: userData?.topPercentage ?? 50,
    // Stub — replace with a real Firestore subcollection read when available
    calendarData: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      usageMinutes: Math.floor(Math.random() * 140),
    })),
    mostUsedApps: await getAppUsageList(),
  };
}

/**
 * Log a session of app usage.
 */
export async function logUsageSession(uid: string, appName: string, minutes: number): Promise<void> {
  await addDoc(collection(db, 'users', uid, 'sessions'), {
    appName,
    minutes,
    timestamp: serverTimestamp(),
  });
}
