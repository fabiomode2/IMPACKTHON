/**
 * services/auth.ts
 *
 * Complete Firebase Authentication service for Lesser.
 *
 * Strategy: users register with a username + password.
 * Internally we create a synthetic email: username@lesser.app
 * so Firebase Auth handles everything without exposing real emails.
 *
 * All Firestore user documents live at /users/{uid}.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
  UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  collection,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from './firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Mode = 'soft' | 'mid' | 'hardcore';

export interface UserProfile {
  uid: string;
  username: string;
  email?: string;
  mode: Mode;
  streakDays: number;
  createdAt: Date;
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

/** Reads a Firestore user profile document and shapes it into UserProfile */
async function readProfile(uid: string, usernameHint?: string): Promise<UserProfile> {
  const snap = await getDoc(doc(db, 'users', uid));
  const data = snap.data();
  return {
    uid,
    username:   data?.username   ?? usernameHint ?? 'User',
    email:      data?.email,
    mode:       data?.mode       ?? 'mid',
    streakDays: data?.streakDays ?? 0,
    createdAt:  data?.createdAt?.toDate() ?? new Date(),
  };
}

// ─── Auth operations ──────────────────────────────────────────────────────────

/**
 * Register a new user.
 * Creates Firebase Auth account + Firestore /users/{uid} document.
 */
export async function registerUser(username: string, password: string): Promise<AuthResult> {
  try {
    const email: string = usernameToEmail(username);
    const credential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = credential.user;

    await setDoc(doc(db, 'users', uid), {
      username,
      email,
      mode: 'mid',
      streakDays: 0,
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      user: { uid, username, email, mode: 'mid', streakDays: 0, createdAt: new Date() },
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
 * Update the display username stored in Firestore.
 * Does NOT change the Firebase Auth email (which is internal).
 */
export async function updateUsername(uid: string, newUsername: string): Promise<AuthResult> {
  try {
    await updateDoc(doc(db, 'users', uid), { username: newUsername });
    const profile = await readProfile(uid);
    return { success: true, user: { ...profile, username: newUsername } };
  } catch (err: unknown) {
    return { success: false, error: friendlyAuthError(err) };
  }
}

/**
 * Change the user's password.
 * Requires re-authentication first (Firebase security requirement).
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user || !user.email) return { success: false, error: 'Not authenticated.' };

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await firebaseUpdatePassword(user, newPassword);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: friendlyAuthError(err) };
  }
}

/**
 * Permanently delete the user's account.
 *
 * Steps:
 * 1. Re-authenticate (Firebase requires this for destructive operations)
 * 2. Delete all Firestore data (user doc + subcollections)
 * 3. Delete Firebase Auth account
 *
 * Note: followers/following subcollection cleanup is handled by
 * the `onUserDeleted` Cloud Function to avoid client-side race conditions.
 */
export async function deleteAccount(
  currentPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user || !user.email) return { success: false, error: 'Not authenticated.' };

  try {
    // 1. Re-authenticate
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // 2. Delete Firestore data (subcollections cleaned by Cloud Function)
    await deleteDoc(doc(db, 'users', user.uid));

    // 3. Delete Auth account (triggers onUserDeleted Cloud Function)
    await deleteUser(user);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: friendlyAuthError(err) };
  }
}

// ─── Error mapping ────────────────────────────────────────────────────────────

function friendlyAuthError(err: unknown): string {
  if (!(err instanceof Error)) return 'An unknown error occurred.';
  const code = (err as { code?: string }).code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':    return 'This username is already taken.';
    case 'auth/user-not-found':          return 'Username not found.';
    case 'auth/wrong-password':          return 'Incorrect password.';
    case 'auth/weak-password':           return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':       return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed':  return 'Network error. Check your connection.';
    case 'auth/requires-recent-login':   return 'Please log out and log in again before this action.';
    default: return err.message || 'Something went wrong.';
  }
}
