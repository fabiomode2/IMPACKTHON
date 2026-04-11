import { NativeModules, Platform } from 'react-native';

type AppUsage = {
  packageName: string;
  appName: string;
  totalMs: number;
};

type UsageResult = {
  permissionStatus: 'granted' | 'denied';
  totalMs: number;
  apps: AppUsage[];
};

const NativeScreenTime = NativeModules.ScreenTimeModule;

export const isScreenTimeNativeLoaded =
  Platform.OS === 'android' && !!NativeScreenTime;

export async function getUsageLast24h(): Promise<UsageResult> {
  if (Platform.OS !== 'android') {
    return { permissionStatus: 'denied', totalMs: 0, apps: [] };
  }

  if (!NativeScreenTime) {
    throw new Error('ScreenTimeModule no está cargado en Android');
  }

  return NativeScreenTime.getUsageLast24h();
}

export async function isUsageAccessGranted(): Promise<boolean> {
  if (Platform.OS !== 'android' || !NativeScreenTime) return false;
  return NativeScreenTime.isUsageAccessGranted();
}

export function openUsageAccessSettings(): void {
  if (Platform.OS === 'android' && NativeScreenTime) {
    NativeScreenTime.openUsageAccessSettings();
  }
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}
