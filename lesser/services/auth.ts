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
  query,
  where,
  limit,
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
  followersCount?: number;
  followingCount?: number;
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
    followersCount: data?.followersCount ?? 0,
    followingCount: data?.followingCount ?? 0,
    createdAt:  data?.createdAt?.toDate() ?? new Date(),
  };
}

// ─── Auth operations ──────────────────────────────────────────────────────────

/**
 * Check if a username is already taken in Firestore.
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  const q = query(
    collection(db, 'users'),
    where('username', '==', username.trim()),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Register a new user.
 * Creates Firebase Auth account + Firestore /users/{uid} document.
 */
export async function registerUser(username: string, password: string): Promise<AuthResult> {
  try {
    const trimmed = username.trim();
    // 1. Explicit check for username
    const taken = await isUsernameTaken(trimmed);
    if (taken) {
      return { success: false, error: 'Este nombre de usuario ya está en uso.' };
    }

    const email: string = usernameToEmail(trimmed);
    const credential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = credential.user;

    await setDoc(doc(db, 'users', uid), {
      username: trimmed,
      username_lowercase: trimmed.toLowerCase(),
      email,
      mode: 'mid',
      streakDays: 0,
      followersCount: 0,
      followingCount: 0,
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      user: { uid, username: trimmed, email, mode: 'mid', streakDays: 0, followersCount: 0, followingCount: 0, createdAt: new Date() },
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
    // If username is changing, check for collisions
    if (data.username) {
        const taken = await isUsernameTaken(data.username);
        if (taken) {
            return { success: false, error: 'Este nombre de usuario ya está en uso.' };
        }
    }

    const updateMap: any = { ...data };
    if (data.username) {
        updateMap.username_lowercase = data.username.toLowerCase();
    }
    if (data.createdAt) delete updateMap.createdAt; // Don't update creation date

    await updateDoc(doc(db, 'users', uid), updateMap);
    const profile = await readProfile(uid);
    return { success: true, user: profile };
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
  if (!user || !user.email) return { success: false, error: 'No autenticado.' };

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
 */
export async function deleteAccount(
  currentPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user || !user.email) return { success: false, error: 'No autenticado.' };

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Attempt to delete the user document. If there are subcollections, Firestore might balk
    // or leave orphan documents, but we MUST delete the User auth regardless to sever access.
    try {
      await deleteDoc(doc(db, 'users', user.uid));
    } catch (dbErr) {
      console.warn("Failed to cleanly delete user document, but proceeding with Auth deletion:", dbErr);
    }

    await deleteUser(user);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: friendlyAuthError(err) };
  }
}

// ─── Error mapping ────────────────────────────────────────────────────────────

function friendlyAuthError(err: unknown): string {
  if (!(err instanceof Error)) return 'Error desconocido.';
  const code = (err as { code?: string }).code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':    return 'Este nombre de usuario ya está ocupado.';
    case 'auth/user-not-found':          return 'Usuario no encontrado.';
    case 'auth/wrong-password':          return 'Contraseña incorrecta.';
    case 'auth/invalid-credential':      return 'Credenciales inválidas.';
    case 'auth/weak-password':           return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/too-many-requests':       return 'Demasiados intentos. Prueba más tarde.';
    case 'auth/network-request-failed':  return 'Error de red. Revisa tu conexión.';
    case 'auth/requires-recent-login':   return 'Cierra sesión e inicia de nuevo antes de esta acción.';
    case 'auth/invalid-email':           return 'Nombre de usuario inválido.';
    default: return err.message || 'Algo salió mal.';
  }
}
