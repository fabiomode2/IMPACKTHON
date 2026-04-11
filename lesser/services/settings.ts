/**
 * services/settings.ts
 *
 * Realtime Database-backed user settings service.
 * Settings live at /users/{uid}/settings
 */

import { ref, get, set, update } from 'firebase/database';
import { rtdb } from './firebase';
import { Mode } from './auth';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WhitelistedApp {
  id: string;
  name: string;
  icon: string;
  isWhitelisted: boolean;
}

export interface UserSettings {
  mode: Mode;
  whitelistedApps: WhitelistedApp[];
  silentNudgeEnabled: boolean;
  silentNudgeThreshold: number; // in minutes
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_APPS: WhitelistedApp[] = [
  { id: '1', name: 'WhatsApp',    icon: 'message.fill',           isWhitelisted: true  },
  { id: '2', name: 'Google Maps', icon: 'map.fill',               isWhitelisted: true  },
  { id: '3', name: 'Spotify',     icon: 'play.circle.fill',       isWhitelisted: false },
  { id: '4', name: 'Banking App', icon: 'building.columns.fill',  isWhitelisted: true  },
];

export const DEFAULT_SETTINGS: UserSettings = {
  mode: 'mid',
  whitelistedApps: DEFAULT_APPS,
  silentNudgeEnabled: false,
  silentNudgeThreshold: 10,
};

// ─── Operations ───────────────────────────────────────────────────────────────

/**
 * Fetch user settings from Realtime Database.
 * Falls back to defaults if no settings node exists yet.
 */
export async function fetchSettings(uid: string): Promise<UserSettings> {
  try {
    const snap = await get(ref(rtdb, `users/${uid}/settings`));
    if (snap.exists()) {
      const data = snap.val();
      return {
        mode:                 data.mode                 ?? DEFAULT_SETTINGS.mode,
        whitelistedApps:      data.whitelistedApps      ?? DEFAULT_SETTINGS.whitelistedApps,
        silentNudgeEnabled:   data.silentNudgeEnabled   ?? DEFAULT_SETTINGS.silentNudgeEnabled,
        silentNudgeThreshold: data.silentNudgeThreshold ?? DEFAULT_SETTINGS.silentNudgeThreshold,
      };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Persist user settings to Realtime Database.
 */
export async function saveSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
  await update(ref(rtdb, `users/${uid}/settings`), settings);
}
