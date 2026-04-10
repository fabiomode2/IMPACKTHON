/**
 * services/firebase.ts
 *
 * Firebase app initialisation for Lesser.
 * Reads configuration from environment variables (Expo Config).
 *
 * For local development:
 *   1. Copy `.env.example` to `.env` at the repo root
 *   2. Fill in your Firebase project values
 *   3. Restart the Expo dev server
 *
 * For CI / EAS Build: add the same variables as build-time secrets.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyDxJ-LIHuC9SkZb9FOEAvE7HYKmrZTdvYE',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'lesser-30fb8.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'lesser-30fb8',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'lesser-30fb8.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '61247682042',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:61247682042:web:988642756acfb70864e043',
};

// Avoid re-initialising on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
