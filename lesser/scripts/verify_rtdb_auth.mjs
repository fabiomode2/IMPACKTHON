import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDxJ-LIHuC9SkZb9FOEAvE7HYKmrZTdvYE',
  projectId: 'lesser-30fb8',
  databaseURL: 'https://lesser-30fb8-default-rtdb.europe-west1.firebasedatabase.app',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function verifyRTDBStructure() {
  console.log("Verifying Realtime Database logic...");
  
  const testUid = "test_verify_uid_" + Date.now();
  const testUsername = "VerifyUser_" + Math.floor(Math.random() * 1000);
  const lower = testUsername.toLowerCase();

  try {
    // 1. Check if username taken (should be false)
    const snap = await get(ref(db, `usernames/${lower}`));
    console.log(`Username '${lower}' taken? ${snap.exists()}`);

    // 2. Simulate registration write
    console.log(`Writing test user profile to /users/${testUid}...`);
    await set(ref(db, `users/${testUid}`), {
      username: testUsername,
      username_lowercase: lower,
      email: `${lower}@lesser.app`,
      mode: 'mid',
      streakDays: 0,
      createdAt: Date.now(),
    });

    console.log(`Writing username index to /usernames/${lower}...`);
    await set(ref(db, `usernames/${lower}`), testUid);

    // 3. Verify read
    const profileSnap = await get(ref(db, `users/${testUid}`));
    const indexSnap = await get(ref(db, `usernames/${lower}`));

    if (profileSnap.exists() && profileSnap.val().username === testUsername) {
      console.log("✅ SUCCESS: Profile written and read correctly.");
    } else {
      console.error("❌ FAILED: Profile mismatch.");
    }

    if (indexSnap.exists() && indexSnap.val() === testUid) {
      console.log("✅ SUCCESS: Username index written and read correctly.");
    } else {
      console.error("❌ FAILED: Index mismatch.");
    }

    // Cleanup
    await remove(ref(db, `users/${testUid}`));
    await remove(ref(db, `usernames/${lower}`));
    console.log("Cleaned up test data.");

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }
  process.exit(0);
}

verifyRTDBStructure().catch(console.error);
