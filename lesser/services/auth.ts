/**
 * services/auth.ts
 *
 * Complete Firebase Authentication service for Lesser.
 *
 * Strategy: users register with a username + password.
 * Internally we create a synthetic email: username@lesser.app
 * so Firebase Auth handles everything without exposing real emails.
 *
 * All data now lives in Firebase Realtime Database.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  UserCredential,
} from 'firebase/auth';
import {
  ref,
  set,
  get,
  update,
  remove,
  child,
  serverTimestamp,
} from 'firebase/database';
import { auth, rtdb } from './firebase';
import { performFullUserCleanup } from './userCleanup';
import { formatLocalISO } from './usage';
import { t } from '@/constants/i18n';


// ─── Types ───────────────────────────────────────────────────────────────────

export type Mode = 'soft' | 'mid' | 'hardcore';

export interface UserProfile {
  uid: string;
  username: string;
  email?: string;
  mode: Mode;
  goalHours?: number;
  goalMinutes?: number;
  streakDays: number;
  followersCount?: number;
  followingCount?: number;
  createdAt: Date | number;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Maps a display username to a synthetic Firebase Auth email */
function usernameToEmail(username: string): string {
  return `${username.toLowerCase().trim()}@lesser.app`;
}

/** Validates username for RTDB and email compatibility */
export function isValidUsername(username: string): boolean {
  const regex = /^[a-zA-Z0-9_]+$/;
  return regex.test(username);
}

/** Reads a Realtime Database user profile and shapes it into UserProfile */
async function readProfile(uid: string, usernameHint?: string): Promise<UserProfile> {
  const snap = await get(ref(rtdb, `users/${uid}`));
  const data = snap.val();

  return {
    uid,
    username: data?.username ?? usernameHint ?? 'User',
    email: data?.email,
    mode: data?.mode ?? 'mid',
    goalHours: data?.goalHours ?? 4,
    goalMinutes: data?.goalMinutes ?? 240,
    streakDays: data?.streakDays ?? 0,
    followersCount: data?.followersCount ?? 0,
    followingCount: data?.followingCount ?? 0,
    createdAt:  data?.createdAt ? new Date(data.createdAt) : new Date(),
  };
}

// ─── Auth operations ──────────────────────────────────────────────────────────

/**
 * Check if a username is already taken in RTDB.
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  const lower = username.trim().toLowerCase();
  if (!lower) return true;
  const snap = await get(ref(rtdb, `usernames/${lower}`));
  return snap.exists();
}

/**
 * Register a new user.
 * Creates Firebase Auth account + RTDB /users/{uid} and /usernames/{lower} entries.
 */
export async function registerUser(username: string, password: string, mode: Mode = 'mid', goalHours: number = 4): Promise<AuthResult> {
  try {
    const trimmed = username.trim();
    const lower = trimmed.toLowerCase();

    // 1. Validation
    if (!isValidUsername(trimmed)) {
      return { success: false, error: t('auth.errorUsernameInvalid') };
    }

    if (password.length < 6) {
      return { success: false, error: t('auth.errorPasswordShort') };
    }

    // 2. Explicit check for username in DB
    const taken = await isUsernameTaken(trimmed);
    if (taken) {
      return { success: false, error: t('auth.errorUsernameTaken') };
    }

    const email: string = usernameToEmail(trimmed);
    const credential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = credential.user;

    // 2. Save to RTDB
    const timestamp = serverTimestamp();
    const today = formatLocalISO(new Date());



    // Atomic-like write (though not truly atomic without update({...}))
    await set(ref(rtdb, `users/${uid}`), {
      username: trimmed,
      username_lowercase: lower,
      email,
      mode,
      goalHours,
      streakDays: 0,
      followersCount: 0,
      followingCount: 0,
      createdAt: timestamp,
      daily_usage: {
        [today]: {
          totalMinutes: 0,
        }
      }
    });

    await set(ref(rtdb, `usernames/${lower}`), uid);

    return {
      success: true,
      user: {
        uid,
        username: trimmed,
        email,
        mode,
        goalHours,
        goalMinutes: goalHours * 60,
        streakDays: 0,
        followersCount: 0,
        followingCount: 0,
        createdAt: Date.now()
      },
    };
  } catch (err: unknown) {
    return { success: false, error: friendlyAuthError(err) };
  }
}

/**
 * Log in with username + password.
 */
export async function loginUser(username: string, password: string): Promise<AuthResult> {
  try {
    const email: string = usernameToEmail(username);
    const credential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await readProfile(credential.user.uid, username);
    return { success: true, user: profile };
  } catch (err: unknown) {
    return { success: false, error: friendlyAuthError(err) };
  }
}

/**
 * Log out the current user.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Generic function to update any user profile field.
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<AuthResult> {
  try {
    // If username is changing, handle it (complex in RTDB, usually we don't allow it easily)
    if (data.username) {
      // This prototype doesn't support easy username changes yet because we'd need to
      // update /usernames/ index and delete the old one.
      // For now, we'll just check if it's taken if it's DIFFERENT.
      const currentProfile = await readProfile(uid);
      if (data.username.toLowerCase() !== currentProfile.username.toLowerCase()) {
        const taken = await isUsernameTaken(data.username);
        if (taken) {
          return { success: false, error: t('auth.errorUsernameTaken') };
        }
        // If we allowed it, we'd need to update BOTH nodes.
        // Keeping it simple: just update the field for now.
      }
    }

    const updateMap: any = { ...data };
    if (data.username) {
      updateMap.username_lowercase = data.username.toLowerCase();
    }
    if (data.createdAt) delete updateMap.createdAt;

    await update(ref(rtdb, `users/${uid}`), updateMap);

    // If username changed, update the index (simplistic)
    if (data.username) {
      await set(ref(rtdb, `usernames/${data.username.toLowerCase()}`), uid);
    }

    const profile = await readProfile(uid);
    return { success: true, user: profile };
  } catch (err: unknown) {
    return { success: false, error: friendlyAuthError(err) };
  }
}

/**
 * Updates the daily screen time goal (in minutes) for a user.
 */
export async function updateGoalMinutes(
  uid: string,
  goalMinutes: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await update(ref(rtdb, `users/${uid}`), { goalMinutes });
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: friendlyAuthError(err) };
  }
}


/**
 * Permanently delete the user's account.
 */
export async function deleteAccount(
  currentPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user || !user.email) return { success: false, error: t('auth.errorGeneric') };

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    const uid = user.uid;
    const profile = await readProfile(uid);
    const username = profile.username;
    const lower = username.toLowerCase();

    // Cleanup deep references (social, feed, Firestore, presence)
    await performFullUserCleanup(uid, username);

    // Cleanup core RTDB nodes
    try {
      await remove(ref(rtdb, `users/${uid}`));
      await remove(ref(rtdb, `usernames/${lower}`));
    } catch (dbErr) {
      console.warn("Failed to cleanly delete user data from RTDB:", dbErr);
    }

    await deleteUser(user);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: friendlyAuthError(err) };
  }
}

// ─── Error mapping ────────────────────────────────────────────────────────────

function friendlyAuthError(err: unknown): string {
  if (!(err instanceof Error)) return t('auth.genericError');
  const errorObj = err as any;
  const code = errorObj.code ?? '';
  const message = errorObj.message ?? '';

  // Handle Firebase Auth codes
  switch (code) {
    case 'auth/email-already-in-use': return t('auth.errorUsernameTaken');
    case 'auth/user-not-found': return t('auth.errorUserNotFound');
    case 'auth/wrong-password': return t('auth.errorWrongPassword');
    case 'auth/invalid-credential': return t('auth.errorInvalidCredential');
    case 'auth/weak-password': return t('auth.errorPasswordShort');
    case 'auth/too-many-requests': return t('auth.errorTooManyRequests');
    case 'auth/network-request-failed': return t('auth.errorNetworkFailed');
    case 'auth/requires-recent-login': return t('auth.errorRecentLogin');
    case 'auth/invalid-email': return t('auth.errorInvalidEmail');
  }

  // Handle Realtime Database / Firebase errors
  if (message.includes('PERMISSION_DENIED') || code === 'PERMISSION_DENIED') {
    return t('auth.errorPermissionDenied');
  }

  return message || t('auth.genericError');
}
