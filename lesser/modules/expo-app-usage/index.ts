import { requireNativeModule } from 'expo-modules-core';

export interface DailyUsageStats {
  totalHours: number;
  apps: Array<{
    packageName: string;
    name: string;
    usageTime: number; // minutes
    icon: string;
  }>;
}

const ExpoAppUsage = requireNativeModule('ExpoAppUsage');

export function hasPermission(): boolean {
  try {
    return ExpoAppUsage.hasPermission();
  } catch (e) {
    console.warn("UsageStats not supported on this platform.");
    return false;
  }
}

export function requestPermission(): void {
  try {
    ExpoAppUsage.requestPermission();
  } catch (e) {
    console.warn("UsageStats not supported on this platform.");
  }
}

export function getDailyUsageStats(): DailyUsageStats {
  try {
    return ExpoAppUsage.getDailyUsageStats();
  } catch (e) {
    return { totalHours: 0, apps: [] };
  }
}
