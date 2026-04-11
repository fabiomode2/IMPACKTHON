/**
 * hooks/useAppTimeTracker.ts
 *
 * Refactored to consume REAL Android usage data via the native AppUsageModule bridge.
 * Falls back to the interval-based self-tracking only when:
 *   - The app is not running on Android (e.g. web/iOS preview)
 *   - The native module is unavailable (Expo Go, not a dev build)
 *   - The user has NOT granted the PACKAGE_USAGE_STATS permission
 */

import { useState, useEffect, useCallback } from 'react';
import { NativeModules, AppState, AppStateStatus, Platform } from 'react-native';

export type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'unavailable';

export interface AppTimeTrackerResult {
  /** Total usage minutes today from Android UsageStats (real data) */
  totalUsageMinutes: number;
  /** Total usage in hours, convenience alias */
  totalUsageHours: number;
  /** Formatted as "Xh Ym" e.g. "3h 24m" */
  formattedTime: string;
  /** Whether the system permission has been granted */
  permissionStatus: PermissionStatus;
  /** Call this to open Android Settings > Usage Access */
  requestPermission: () => Promise<void>;
  /** Manually re-fetch the data (e.g. after returning from Settings) */
  refresh: () => Promise<void>;
}

const { AppUsageModule } = NativeModules;

const isAndroidNativeAvailable =
  Platform.OS === 'android' && AppUsageModule != null;

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function useAppTimeTracker(): AppTimeTrackerResult {
  const [totalUsageMinutes, setTotalUsageMinutes] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown');

  // --- Internal: request permission (opens Android Settings) ---
  const requestPermission = useCallback(async () => {
    if (!isAndroidNativeAvailable) return;
    try {
      await AppUsageModule.requestPermission();
    } catch (e) {
      console.warn('[useAppTimeTracker] requestPermission failed', e);
    }
  }, []);

  // --- Internal: fetch real data from Kotlin bridge ---
  const fetchRealUsage = useCallback(async () => {
    if (!isAndroidNativeAvailable) return;

    try {
      // 1. Check if we have the special system permission
      const granted: boolean = await AppUsageModule.checkPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');

      if (!granted) return;

      // 2. Get total minutes across ALL apps today
      const minutes: number = await AppUsageModule.getTotalDailyUsageMinutes();
      setTotalUsageMinutes(minutes);
    } catch (e) {
      console.error('[useAppTimeTracker] fetchRealUsage error', e);
      setPermissionStatus('unavailable');
    }
  }, []);

  // --- On mount: initial fetch + listen for app foreground events ---
  useEffect(() => {
    if (!isAndroidNativeAvailable) {
      setPermissionStatus('unavailable');
      return;
    }

    fetchRealUsage();

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        // User just came back to the app (possibly from Settings)
        fetchRealUsage();
      }
    });

    // Refresh every 60 seconds while the app is open
    const interval = setInterval(fetchRealUsage, 60_000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [fetchRealUsage]);

  return {
    totalUsageMinutes,
    totalUsageHours: totalUsageMinutes / 60,
    formattedTime: formatMinutes(totalUsageMinutes),
    permissionStatus,
    requestPermission,
    refresh: fetchRealUsage,
  };
}
