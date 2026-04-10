/**
 * services/auth.ts
 * 
 * Firebase-ready Auth Service.
 * Currently uses in-memory mock. Replace implementations with Firebase SDK calls.
 * 
 * Firebase integration points are marked with: // [FIREBASE]
 */

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

// [FIREBASE] import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
// [FIREBASE] import { auth } from './firebase';

/**
 * Log in with username/password.
 * Replace with Firebase Authentication.
 */
export async function loginUser(username: string, _password: string): Promise<AuthResult> {
  // [FIREBASE] const credential = await signInWithEmailAndPassword(auth, email, password);
  // [FIREBASE] return { success: true, user: { uid: credential.user.uid, username, createdAt: new Date() } };
  
  // Mock implementation
  await new Promise(r => setTimeout(r, 500)); // Simulate network delay
  return {
    success: true,
    user: { uid: 'mock-uid-123', username, createdAt: new Date() },
  };
}

/**
 * Register a new user.
 * Replace with Firebase Authentication + Firestore user document creation.
 */
export async function registerUser(username: string, _password: string): Promise<AuthResult> {
  // [FIREBASE] const credential = await createUserWithEmailAndPassword(auth, email, password);
  // [FIREBASE] await setDoc(doc(db, 'users', credential.user.uid), { username, createdAt: new Date() });
  // [FIREBASE] return { success: true, user: { uid: credential.user.uid, username, createdAt: new Date() } };
  
  // Mock implementation
  await new Promise(r => setTimeout(r, 500));
  return {
    success: true,
    user: { uid: 'mock-uid-new', username, createdAt: new Date() },
  };
}

/**
 * Log out the current user.
 * Replace with Firebase signOut.
 */
export async function logoutUser(): Promise<void> {
  // [FIREBASE] await signOut(auth);
}
