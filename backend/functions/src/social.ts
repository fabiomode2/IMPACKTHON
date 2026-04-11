/**
 * functions/src/social.ts
 *
 * HTTPS Callable Cloud Functions for follow / unfollow operations.
 *
 * Why Cloud Functions instead of client-side batch writes?
 * ─────────────────────────────────────────────────────────
 * Firestore Security Rules prevent clients from writing to
 * /users/{uid}/followers (only Cloud Functions may do so).
 * This guarantees both sides of the follow relationship are
 * **always** consistent — no half-written states.
 *
 * Client usage (via firebase/functions):
 *   const followUser   = httpsCallable(functions, 'onFollowUser');
 *   const unfollowUser = httpsCallable(functions, 'onUnfollowUser');
 *   await followUser({ targetUid: 'abc123', targetUsername: 'Alice' });
 */

import { https, logger } from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ─── onFollowUser ─────────────────────────────────────────────────────────────

interface FollowData {
  targetUid:      string;
  targetUsername: string;
  myUsername:     string;
}

/**
 * Atomic batch write that adds:
 *   /users/{targetUid}/followers/{myUid}   — target gains a follower
 *   /users/{myUid}/following/{targetUid}   — caller gains a following entry
 */
export const onFollowUser = https.onCall(async (data: FollowData, context) => {
  if (!context.auth) {
    throw new https.HttpsError('unauthenticated', 'Must be signed in.');
  }

  const myUid = context.auth.uid;
  const { targetUid, targetUsername, myUsername } = data;

  if (!targetUid || typeof targetUid !== 'string') {
    throw new https.HttpsError('invalid-argument', 'targetUid is required.');
  }
  if (myUid === targetUid) {
    throw new https.HttpsError('invalid-argument', 'Cannot follow yourself.');
  }

  logger.info(`[onFollowUser] ${myUid} → ${targetUid}`);

  const db    = getFirestore();
  const batch = db.batch();

  // target's followers subcollection
  batch.set(db.doc(`users/${targetUid}/followers/${myUid}`), {
    uid:        myUid,
    username:   myUsername,
    followedAt: FieldValue.serverTimestamp(),
  });

  // caller's following subcollection
  batch.set(db.doc(`users/${myUid}/following/${targetUid}`), {
    uid:        targetUid,
    username:   targetUsername,
    followedAt: FieldValue.serverTimestamp(),
  });

  // add notification to target's notifications subcollection
  const notifRef = db.collection(`users/${targetUid}/notifications`).doc();
  batch.set(notifRef, {
    type: 'NEW_FOLLOWER',
    fromUid: myUid,
    fromUsername: myUsername,
    read: false,
    timestamp: FieldValue.serverTimestamp(),
  });

  // Increment counters
  batch.update(db.doc(`users/${targetUid}`), {
    followersCount: FieldValue.increment(1),
  });
  batch.update(db.doc(`users/${myUid}`), {
    followingCount: FieldValue.increment(1),
  });

  await batch.commit();
  return { success: true };
});

// ─── onUnfollowUser ───────────────────────────────────────────────────────────

interface UnfollowData {
  targetUid: string;
}

/**
 * Atomic batch delete that removes:
 *   /users/{targetUid}/followers/{myUid}
 *   /users/{myUid}/following/{targetUid}
 */
export const onUnfollowUser = https.onCall(async (data: UnfollowData, context) => {
  if (!context.auth) {
    throw new https.HttpsError('unauthenticated', 'Must be signed in.');
  }

  const myUid = context.auth.uid;
  const { targetUid } = data;

  if (!targetUid || typeof targetUid !== 'string') {
    throw new https.HttpsError('invalid-argument', 'targetUid is required.');
  }

  logger.info(`[onUnfollowUser] ${myUid} ↛ ${targetUid}`);

  const db    = getFirestore();
  const batch = db.batch();

  batch.delete(db.doc(`users/${targetUid}/followers/${myUid}`));
  batch.delete(db.doc(`users/${myUid}/following/${targetUid}`));

  // Decrement counters
  batch.update(db.doc(`users/${targetUid}`), {
    followersCount: FieldValue.increment(-1),
  });
  batch.update(db.doc(`users/${myUid}`), {
    followingCount: FieldValue.increment(-1),
  });

  await batch.commit();
  return { success: true };
});
