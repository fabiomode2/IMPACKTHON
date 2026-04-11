import { ref, get, remove, update } from 'firebase/database';
import { doc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { rtdb, db } from './firebase';

/**
 * Perform a deep cleanup of all user-related data across RTDB and Firestore.
 * This version prioritizes presence and social ties and is error-resilient.
 */
export async function performFullUserCleanup(uid: string, username: string): Promise<void> {
  console.log(`[userCleanup] Initiating total destruction of data for ${uid} (@${username})`);

  // 1. Presence (MUST BE FIRST)
  // Deleting status/uid ensures the user doesn't stay "online" while they are being wiped.
  try {
    console.log(`[userCleanup] Removing presence node: status/${uid}`);
    await remove(ref(rtdb, `status/${uid}`));
  } catch (error) {
    console.warn(`[userCleanup] Failed to cleanup status for ${uid}:`, error);
  }

  // 2. Relationships in RTDB
  try {
    await cleanupRtdbRelationships(uid);
  } catch (error) {
    console.warn(`[userCleanup] Failed to cleanup RTDB relationships for ${uid}:`, error);
  }

  // 3. Global Activity Feed in RTDB
  try {
    await cleanupRtdbFeed(uid);
  } catch (error) {
    console.warn(`[userCleanup] Failed to cleanup RTDB feed for ${uid}:`, error);
  }

  // 4. Firestore Data
  try {
    await cleanupFirestoreUser(uid);
  } catch (error) {
    console.warn(`[userCleanup] Failed to cleanup Firestore data for ${uid}:`, error);
  }

  console.log(`[userCleanup] Deep cleanup sequence finished for ${uid}`);
}

/**
 * Removes user references from others' follower and following lists.
 */
async function cleanupRtdbRelationships(uid: string): Promise<void> {
  // Get my followers list
  const followersSnap = await get(ref(rtdb, `users/${uid}/followers`));
  const followers = followersSnap.val();
  
  const updates: any = {};

  if (followers) {
    Object.keys(followers).forEach(followerUid => {
      // For each follower, remove me from their "following" list
      updates[`users/${followerUid}/following/${uid}`] = null;
    });
  }

  // Get people I follow
  const followingSnap = await get(ref(rtdb, `users/${uid}/following`));
  const following = followingSnap.val();

  if (following) {
    Object.keys(following).forEach(followedUid => {
      // For each person I follow, remove me from their "followers" list
      updates[`users/${followedUid}/followers/${uid}`] = null;
    });
  }

  if (Object.keys(updates).length > 0) {
    console.log(`[userCleanup] Clearing ${Object.keys(updates).length} cross-user social references...`);
    await update(ref(rtdb), updates);
  }
}

/**
 * Removes all posts by this user from the global activity feed.
 */
async function cleanupRtdbFeed(uid: string): Promise<void> {
  const feedSnap = await get(ref(rtdb, 'feedPosts'));
  const feedData = feedSnap.val();
  
  if (!feedData) return;

  const updates: any = {};
  Object.keys(feedData).forEach(postId => {
    if (feedData[postId]?.uid === uid) {
      updates[`feedPosts/${postId}`] = null;
    }
  });

  if (Object.keys(updates).length > 0) {
    console.log(`[userCleanup] Removing ${Object.keys(updates).length} global feed entries...`);
    await update(ref(rtdb), updates);
  }
}

/**
 * Removes Firestore user document and all subcollections.
 */
async function cleanupFirestoreUser(uid: string): Promise<void> {
  try {
    const sessionsRef = collection(db, 'users', uid, 'sessions');
    const sessionsSnap = await getDocs(sessionsRef);
    
    if (!sessionsSnap.empty) {
      console.log(`[userCleanup] Clearing Firestore subcollection 'sessions'...`);
      const batch = writeBatch(db);
      sessionsSnap.forEach((doc) => { batch.delete(doc.ref); });
      await batch.commit();
    }

    await deleteDoc(doc(db, 'users', uid));
    console.log(`[userCleanup] Main Firestore user document deleted.`);
  } catch (err) {
    // If Firestore is unreachable, we don't worry too much here; handled by performFullUserCleanup try/catch
    throw err;
  }
}
