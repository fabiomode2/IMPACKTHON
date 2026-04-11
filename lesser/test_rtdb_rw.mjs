import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDxJ-LIHuC9SkZb9FOEAvE7HYKmrZTdvYE',
  projectId: 'lesser-30fb8',
  databaseURL: 'https://lesser-30fb8-default-rtdb.europe-west1.firebasedatabase.app',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function testRW() {
  const testRef = ref(db, 'system_test/ping');
  try {
    const timestamp = Date.now();
    await set(testRef, { timestamp });
    console.log("✅ SUCCESS: Written to RTDB system_test/ping");
    
    const snap = await get(testRef);
    if (snap.exists() && snap.val().timestamp === timestamp) {
      console.log("✅ SUCCESS: Read from RTDB system_test/ping");
    } else {
      console.log("❌ FAILED: Data read did not match.");
    }
  } catch (error) {
    console.error("❌ FAILED RW operation:", error.message);
  }
  process.exit(0);
}

testRW();
