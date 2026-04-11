import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getDatabase, ref, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDxJ-LIHuC9SkZb9FOEAvE7HYKmrZTdvYE',
  projectId: 'lesser-30fb8',
  databaseURL: 'https://lesser-30fb8-default-rtdb.europe-west1.firebasedatabase.app',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);

async function inspect() {
  console.log("--- FIRESTORE USERS ---");
  const fSnap = await getDocs(collection(db, 'users'));
  fSnap.docs.forEach(d => console.log(`- ${d.id}:`, d.data()));

  console.log("\n--- RTDB USERS ---");
  const uSnap = await get(ref(rtdb, 'users'));
  console.log(JSON.stringify(uSnap.val(), null, 2));

  console.log("\n--- RTDB USERNAMES ---");
  const nSnap = await get(ref(rtdb, 'usernames'));
  console.log(JSON.stringify(nSnap.val(), null, 2));

  console.log("\n--- RTDB FEED POSTS ---");
  const pSnap = await get(ref(rtdb, 'feedPosts'));
  console.log(JSON.stringify(pSnap.val(), null, 2));

  process.exit(0);
}

inspect().catch(console.error);
