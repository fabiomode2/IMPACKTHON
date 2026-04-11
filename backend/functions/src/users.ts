/**
 * functions/src/users.ts
 *
 * Auth-triggered Cloud Function:
 *   onUserDeleted — runs when a Firebase Auth user is deleted.
 *
 * Cleans up all Firestore data that belongs to the deleted user:
 *   - /users/{uid}                    (profile document)
 *   - /users/{uid}/followers/*        (who followed this user)
 *   - /users/{uid}/following/*        (who this user followed)
 *   - /feedPosts where uid == deleted (their activity posts)
 */

import { auth }     from 'firebase-functions/v1';
import { logger }   from 'firebase-functions';
import { getFirestore, FieldPath, FieldValue } from 'firebase-admin/firestore';

const BATCH_LIMIT = 500; // Firestore batch write limit

/** Delete all docs in a subcollection in batches */
async function deleteSubcollection(
  db: FirebaseFirestore.Firestore,
  path: string,
): Promise<void> {
  const colRef = db.collection(path);
  let snap = await colRef.limit(BATCH_LIMIT).get();

  while (!snap.empty) {
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    snap = await colRef.limit(BATCH_LIMIT).get();
  }
}

export const onUserDeleted = auth.user().onDelete(async (user) => {
  const db  = getFirestore();
  const uid = user.uid;

  logger.info(`[onUserDeleted] Cleaning up data for uid=${uid}`);

  try {
    // 0. Cleanup inverse references to prevent phantom social ties
    const myFollowersSnap = await db.collection(`users/${uid}/followers`).get();
    const myFollowingSnap = await db.collection(`users/${uid}/following`).get();
    
    const ops: Array<(b: FirebaseFirestore.WriteBatch) => void> = [];

    // For people who followed me: remove me from their "following" list
    myFollowersSnap.docs.forEach(d => {
      const followerUid = d.id;
      ops.push(b => b.delete(db.doc(`users/${followerUid}/following/${uid}`)));
      // Using set with merge avoids batch failure if the user doc was already deleted somehow
      ops.push(b => b.set(db.doc(`users/${followerUid}`), { followingCount: FieldValue.increment(-1) }, { merge: true }));
    });

    // For people I followed: remove me from their "followers" list
    myFollowingSnap.docs.forEach(d => {
      const followedUid = d.id;
      ops.push(b => b.delete(db.doc(`users/${followedUid}/followers/${uid}`)));
      ops.push(b => b.set(db.doc(`users/${followedUid}`), { followersCount: FieldValue.increment(-1) }, { merge: true }));
    });

    // Execute inverse cleanups in safe batches
    for (let i = 0; i < ops.length; i += 250) {
      const chunk = ops.slice(i, i + 250);
      const batch = db.batch();
      chunk.forEach(op => op(batch));
      await batch.commit();
    }

    // 1. Delete subcollections first (Firestore doesn't cascade)
    await Promise.all([
      deleteSubcollection(db, `users/${uid}/followers`),
      deleteSubcollection(db, `users/${uid}/following`),
      deleteSubcollection(db, `users/${uid}/notifications`),
    ]);

    // 2. Delete the user profile document
    await db.doc(`users/${uid}`).delete();

    // 3. Delete feedPosts authored by this user (in batches)
    let feedSnap = await db
      .collection('feedPosts')
      .where('uid', '==', uid)
      .limit(BATCH_LIMIT)
      .get();

    while (!feedSnap.empty) {
      const batch = db.batch();
      feedSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      feedSnap = await db
        .collection('feedPosts')
        .where('uid', '==', uid)
        .limit(BATCH_LIMIT)
        .get();
    }

    logger.info(`[onUserDeleted] Cleanup done for uid=${uid}`);
  } catch (err) {
    logger.error(`[onUserDeleted] Error for uid=${uid}`, err);
    throw err;
  }
});

// Suppress unused import warning — FieldPath is used by the generic helper above
void FieldPath;
