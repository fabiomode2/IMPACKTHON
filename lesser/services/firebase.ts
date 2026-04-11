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
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getDatabase } from 'firebase/database';
import { FIREBASE_CONFIG } from '@/constants/firebase.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();

// Configure Auth with AsyncStorage persistence to fix warning and support session persistence
export const auth = getApps().length === 0 
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    }) 
  : getAuth(app);

export const db        = getFirestore(app);
export const functions = getFunctions(app, 'europe-west1'); // eur3 region
export const rtdb      = getDatabase(app);

export default app;
