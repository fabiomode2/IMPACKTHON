/**
 * constants/firebase.config.ts
 *
 * Public Firebase client-side configuration.
 * These values are identifiers, NOT secrets — they are safe to commit.
 * Real security is enforced by Firestore Security Rules on the server.
 *
 * See: https://firebase.google.com/docs/projects/api-keys
 */
export const FIREBASE_CONFIG = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            ?? 'AIzaSyDxJ-LIHuC9SkZb9FOEAvE7HYKmrZTdvYE',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? 'lesser-30fb8.firebaseapp.com',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         ?? 'lesser-30fb8',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? 'lesser-30fb8.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '61247682042',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             ?? '1:61247682042:web:988642756acfb70864e043',
} as const;
