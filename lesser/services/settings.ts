/**
 * services/settings.ts
 *
 * Firestore-backed user settings service.
 * Settings live at /users/{uid}/settings/preferences
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
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
};

// ─── Operations ───────────────────────────────────────────────────────────────

/**
 * Fetch user settings from Firestore.
 * Falls back to defaults if no settings document exists yet.
 */
export async function fetchSettings(uid: string): Promise<UserSettings> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'settings', 'preferences'));
    if (snap.exists()) {
      const data = snap.data();
      return {
        mode:            data.mode            ?? DEFAULT_SETTINGS.mode,
        whitelistedApps: data.whitelistedApps ?? DEFAULT_SETTINGS.whitelistedApps,
      };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Persist user settings to Firestore (merge so partial updates are safe).
 */
export async function saveSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'settings', 'preferences'),
    settings,
    { merge: true },
  );
}
