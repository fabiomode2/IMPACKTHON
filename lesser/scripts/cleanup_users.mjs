import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
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
  console.log("Starting cleanup...");

  // 1. Cleanup Firestore 'users'
  try {
    const firestoreUsers = await getDocs(collection(db, 'users'));
    console.log(`Deleting ${firestoreUsers.docs.length} users from Firestore...`);
    for (const d of firestoreUsers.docs) {
      await deleteDoc(doc(db, 'users', d.id));
      console.log(`  Deleted Firestore user: ${d.id}`);
    }
  } catch (e) {
    console.error("Error cleaning Firestore users:", e.message);
  }

  // 2. Cleanup RTDB 'users' and 'usernames'
  try {
    console.log("Deleting 'users' and 'usernames' from Realtime Database...");
    await remove(ref(rtdb, 'users'));
    await remove(ref(rtdb, 'usernames'));
    console.log("  RTDB 'users' and 'usernames' cleared.");
  } catch (e) {
    console.error("Error cleaning RTDB:", e.message);
  }

  console.log("Cleanup complete.");
  process.exit(0);
}

cleanup().catch(console.error);
