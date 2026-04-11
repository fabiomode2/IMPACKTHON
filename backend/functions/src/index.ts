/**
 * functions/src/index.ts
 *
 * Entry point for all Cloud Functions.
 * Re-exports from feature modules so Firebase discovers them all.
 */

import { setGlobalOptions } from 'firebase-functions';
import { initializeApp }    from 'firebase-admin/app';

// Initialise Admin SDK once at cold start
initializeApp();

// Cap max containers per function to control costs
setGlobalOptions({ maxInstances: 10, region: 'europe-west1' });

// ── Feature modules ──────────────────────────────────────────────────────────
export { onUserDeleted }                    from './users';
export { onFollowUser, onUnfollowUser }     from './social';
