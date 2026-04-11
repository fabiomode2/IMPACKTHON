import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDxJ-LIHuC9SkZb9FOEAvE7HYKmrZTdvYE',
  projectId: 'lesser-30fb8',
  databaseURL: 'https://lesser-30fb8-default-rtdb.europe-west1.firebasedatabase.app',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const connectedRef = ref(db, '.info/connected');
console.log("Checking connection to Realtime Database...");
onValue(connectedRef, (snap) => {
  if (snap.val() === true) {
    console.log("✅ SUCCESS: Connected to Firebase Realtime Database!");
    process.exit(0);
  }
});

setTimeout(() => {
  console.log("❌ FAILED to connect within 5 seconds.");
  process.exit(1);
}, 5000);
