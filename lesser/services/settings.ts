/**
 * services/settings.ts
 *
 * Firebase-ready Settings Service.
 * Currently uses in-memory defaults. Replace with Firestore.
 *
 * Firebase integration points are marked with: // [FIREBASE]
 */

import { Mode } from './auth';

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

const DEFAULT_APPS: WhitelistedApp[] = [
  { id: '1', name: 'WhatsApp', icon: 'message.fill', isWhitelisted: true },
  { id: '2', name: 'Google Maps', icon: 'map.fill', isWhitelisted: true },
  { id: '3', name: 'Spotify', icon: 'play.circle.fill', isWhitelisted: false },
  { id: '4', name: 'Banking App', icon: 'building.columns.fill', isWhitelisted: true },
];

/**
 * Fetch user settings.
 * Replace with Firestore getDoc.
 */
export async function fetchSettings(_uid: string): Promise<UserSettings> {
  // [FIREBASE] const snap = await getDoc(doc(db, 'users', uid, 'settings', 'preferences'));
  // [FIREBASE] return snap.data() as UserSettings;

  return { mode: 'mid', whitelistedApps: DEFAULT_APPS };
}

/**
 * Save user settings.
 * Replace with Firestore setDoc/updateDoc.
 */
export async function saveSettings(_uid: string, settings: Partial<UserSettings>): Promise<void> {
  // [FIREBASE] await setDoc(doc(db, 'users', uid, 'settings', 'preferences'), settings, { merge: true });
  console.log('[Mock] Saving settings:', settings);
}
