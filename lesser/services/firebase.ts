/**
 * services/firebase.ts
 *
 * Firebase initialisation for the Lesser app.
 * Config values are read from EXPO_PUBLIC_ environment variables,
 * falling back to the project defaults defined in constants/firebase.config.ts.
 *
 * Setup:
 *   cp .env.example .env   (fill in your values, never commit .env)
 *   npx expo start
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { FIREBASE_CONFIG } from '@/constants/firebase.config';

const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();

export const auth      = getAuth(app);
export const db        = getFirestore(app);
export const functions = getFunctions(app, 'europe-west1'); // eur3 region

export default app;
