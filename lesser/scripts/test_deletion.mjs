import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, remove, update } from 'firebase/database';
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDxJ-LIHuC9SkZb9FOEAvE7HYKmrZTdvYE',
  authDomain:        'lesser-30fb8.firebaseapp.com',
  projectId:         'lesser-30fb8',
  storageBucket:     'lesser-30fb8.firebasestorage.app',
  messagingSenderId: '61247682042',
  appId:             '1:61247682042:web:988642756acfb70864e043',
  databaseURL:       'https://lesser-30fb8-default-rtdb.europe-west1.firebasedatabase.app',
};

const app = initializeApp(FIREBASE_CONFIG);
const rtdb = getDatabase(app);
const db = getFirestore(app);

const TEST_UID = 'cleanup_test_user_' + Date.now();
const OTHER_UID = 'cleanup_test_friend_' + Date.now();

async function runTest() {
  console.log(`Setting up test data for ${TEST_UID}...`);

  // 1. Setup RTDB Relationships
  await update(ref(rtdb), {
    [`users/${TEST_UID}/username`]: 'TestUser',
    [`users/${TEST_UID}/followers/${OTHER_UID}`]: { username: 'Friend' },
    [`users/${TEST_UID}/following/${OTHER_UID}`]: { username: 'Friend' },
    [`users/${OTHER_UID}/followers/${TEST_UID}`]: { username: 'TestUser' },
    [`users/${OTHER_UID}/following/${TEST_UID}`]: { username: 'TestUser' },
    [`feedPosts/test_post_1`]: { uid: TEST_UID, message: 'Delete me' },
    [`feedPosts/test_post_2`]: { uid: OTHER_UID, message: 'Keep me' },
    [`status/${TEST_UID}`]: 'online'
  });

  // 2. Setup Firestore
  await setDoc(doc(db, 'users', TEST_UID), { name: 'Test User' });
  await setDoc(doc(collection(db, 'users', TEST_UID, 'sessions'), 'session1'), { duration: 10 });

  console.log("Setup complete. Verifying presence...");
  
  // Quick verification
  const snapPost = await get(ref(rtdb, 'feedPosts/test_post_1'));
  if (!snapPost.exists()) throw new Error("Test post not created");

  console.log("Running cleanup logic...");
  
  // --- CLEANUP LOGIC (Copied from userCleanup.ts for testing) ---
  const uid = TEST_UID;

  // Cleanup RTDB Relationships
  const followersSnap = await get(ref(rtdb, `users/${uid}/followers`));
  const followers = followersSnap.val();
  const updates = {};
  if (followers) {
    Object.keys(followers).forEach(fUid => { updates[`users/${fUid}/following/${uid}`] = null; });
  }
  const followingSnap = await get(ref(rtdb, `users/${uid}/following`));
  const following = followingSnap.val();
  if (following) {
    Object.keys(following).forEach(fUid => { updates[`users/${fUid}/followers/${uid}`] = null; });
  }
  if (Object.keys(updates).length > 0) await update(ref(rtdb), updates);

  // Cleanup RTDB Feed
  const feedSnap = await get(ref(rtdb, 'feedPosts'));
  const feedData = feedSnap.val();
  const feedUpdates = {};
  if (feedData) {
    Object.keys(feedData).forEach(postId => {
      if (feedData[postId].uid === uid) feedUpdates[`feedPosts/${postId}`] = null;
    });
  }
  if (Object.keys(feedUpdates).length > 0) await update(ref(rtdb), feedUpdates);

  // Cleanup Presence
  await remove(ref(rtdb, `status/${uid}`));

  // Cleanup Firestore
  const sessionsSnap = await getDocs(collection(db, 'users', uid, 'sessions'));
  for (const doc of sessionsSnap.docs) { await deleteDoc(doc.ref); }
  await deleteDoc(doc(db, 'users', uid));
  
  // Cleanup Core nodes
  await remove(ref(rtdb, `users/${uid}`));
  // --- END CLEANUP LOGIC ---

  console.log("Cleanup finished. Verifying results...");

  // Verify RTDB Relations
  const otherFollowers = await get(ref(rtdb, `users/${OTHER_UID}/followers/${TEST_UID}`));
  const otherFollowing = await get(ref(rtdb, `users/${OTHER_UID}/following/${TEST_UID}`));
  if (otherFollowers.exists() || otherFollowing.exists()) throw new Error("Relations not cleaned up");

  // Verify Feed
  const myPost = await get(ref(rtdb, 'feedPosts/test_post_1'));
  const otherPost = await get(ref(rtdb, 'feedPosts/test_post_2'));
  if (myPost.exists()) throw new Error("User post still exists");
  if (!otherPost.exists()) throw new Error("Other user's post was accidentally deleted");

  // Verify Presence
  const presence = await get(ref(rtdb, `status/${TEST_UID}`));
  if (presence.exists()) throw new Error("Presence data still exists");

  // Verify Firestore
  const firestoreUser = await getDocs(collection(db, 'users'));
  const testUserFound = firestoreUser.docs.some(d => d.id === TEST_UID);
  if (testUserFound) throw new Error("Firestore user document still exists");

  console.log("SUCCESS: All user data and relationships successfully cleared!");
  process.exit(0);
}

runTest().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
