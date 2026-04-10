/**
 * services/auth.ts
 *
 * Firebase Authentication Service for Lesser.
 * Uses Firebase Auth with email/password strategy.
 * Usernames are stored in Firestore under /users/{uid}.
 *
 * Strategy (Opción B): users log in with username only in the UI.
 * Internally we map username → email as `username@lesser.app`.
 * This avoids requiring users to type an email while still using Firebase Auth.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export type Mode = 'soft' | 'mid' | 'hardcore';

export interface UserProfile {
  uid: string;
  username: string;
  email?: string;
  createdAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

/** Convert a username to a synthetic email for Firebase Auth */
function usernameToEmail(username: string): string {
  return `${username.toLowerCase().trim()}@lesser.app`;
}

/**
 * Log in with username + password.
 * Maps username → synthetic email internally.
 */
export async function loginUser(username: string, password: string): Promise<AuthResult> {
  try {
    const email = usernameToEmail(username);
    const credential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    // Fetch profile from Firestore
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.data();

    return {
      success: true,
      user: {
        uid,
        username: data?.username ?? username,
        email: credential.user.email ?? undefined,
        createdAt: data?.createdAt?.toDate() ?? new Date(),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return { success: false, error: message };
  }
}

/**
 * Register a new user with username + password.
 * Creates Firebase Auth account + Firestore user document.
 */
export async function registerUser(username: string, password: string): Promise<AuthResult> {
  try {
    const email = usernameToEmail(username);
    const credential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    // Create Firestore user document
    await setDoc(doc(db, 'users', uid), {
      username,
      email,
      createdAt: serverTimestamp(),
      mode: 'mid',
      streakDays: 0,
    });

    return {
      success: true,
      user: { uid, username, email, createdAt: new Date() },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return { success: false, error: message };
  }
}

/**
 * Log out the current user.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
