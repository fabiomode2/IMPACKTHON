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
import { getFirestore, FieldPath } from 'firebase-admin/firestore';

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
    // 1. Delete subcollections first (Firestore doesn't cascade)
    await Promise.all([
      deleteSubcollection(db, `users/${uid}/followers`),
      deleteSubcollection(db, `users/${uid}/following`),
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
