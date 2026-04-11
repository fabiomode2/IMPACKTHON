import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { getDatabase, ref, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDxJ-LIHuC9SkZb9FOEAvE7HYKmrZTdvYE',
  projectId: 'lesser-30fb8',
  databaseURL: 'https://lesser-30fb8-default-rtdb.europe-west1.firebasedatabase.app',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);

async function cleanup() {
  console.log("🚀 Starting Full Database Wipe...");

  // 1. Cleanup Firestore 'users' and their subcollections
  try {
    const firestoreUsers = await getDocs(collection(db, 'users'));
    console.log(`🧹 Deleting ${firestoreUsers.docs.length} users and their sessions from Firestore...`);
    
    for (const d of firestoreUsers.docs) {
      const uid = d.id;
      // Delete subcollections (sessions)
      const sessionsSnap = await getDocs(collection(db, 'users', uid, 'sessions'));
      if (!sessionsSnap.empty) {
        const batch = writeBatch(db);
        sessionsSnap.forEach((sDoc) => batch.delete(sDoc.ref));
        await batch.commit();
        console.log(`   - Deleted sessions for user: ${uid}`);
      }
      // Delete main doc
      await deleteDoc(doc(db, 'users', uid));
      console.log(`   - Deleted Firestore user: ${uid}`);
    }
  } catch (e) {
    console.error("❌ Error cleaning Firestore:", e.message);
  }

  // 2. Cleanup RTDB root nodes
  const rtdbNodes = ['users', 'usernames', 'feedPosts', 'status'];
  for (const node of rtdbNodes) {
    try {
      console.log(`🧹 Clearing RTDB node: /${node}...`);
      await remove(ref(rtdb, node));
      console.log(`   - Node /${node} cleared.`);
    } catch (e) {
      console.error(`❌ Error cleaning RTDB node /${node}:`, e.message);
    }
  }

  console.log("\n✅ FULL WIPE COMPLETE.");
  process.exit(0);
}

cleanup().catch(err => {
  console.error("💥 CRITICAL ERROR DURING CLEANUP:", err);
  process.exit(1);
});
