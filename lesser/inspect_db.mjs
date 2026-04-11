import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDxJ-LIHuC9SkZb9FOEAvE7HYKmrZTdvYE',
  projectId: 'lesser-30fb8',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectUsers() {
  console.log("Fetching users...");
  const snap = await getDocs(collection(db, 'users'));
  console.log(`Found ${snap.docs.length} users.`);
  snap.docs.forEach(doc => {
    console.log(`- ID: ${doc.id}`);
    console.log(`  Data:`, doc.data());
  });
  process.exit(0);
}

inspectUsers().catch(console.error);
