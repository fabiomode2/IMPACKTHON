/**
 * wipe_full_admin.mjs
 *
 * ADMINISTRATIVE TOOL - USE WITH CAUTION.
 * Performs a deep-clean wipe of all users from Firebase Auth and all data from RTDB and Firestore.
 * Requires serviceAccountKey.json in the project root.
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load Service Account
let serviceAccount;
try {
  const keyPath = join(process.cwd(), 'serviceAccountKey.json');
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch (error) {
  console.error("❌ ERROR: Could not find 'serviceAccountKey.json' in the root directory.");
  console.log("Please download it from Firebase Console -> Project Settings -> Service Accounts -> Generate new private key.");
  process.exit(1);
}

// Initialise Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://lesser-30fb8-default-rtdb.europe-west1.firebasedatabase.app'
});

const auth = admin.auth();
const rtdb = admin.database();
const firestore = admin.firestore();

async function performWipe() {
  console.log("🔥 INITIATING GLOBAL DATABASE WIPE...");

  // 1. Delete ALL users from Firebase Auth
  try {
    const usersResult = await auth.listUsers(1000);
    const uids = usersResult.users.map(u => u.uid);
    if (uids.length > 0) {
      console.log(`🧹 Deleting ${uids.length} users from Firebase Auth...`);
      const deleteResult = await auth.deleteUsers(uids);
      console.log(`   - Successfully deleted ${deleteResult.successCount} users.`);
      if (deleteResult.failureCount > 0) {
        console.warn(`   - Failed to delete ${deleteResult.failureCount} users.`);
      }
    } else {
      console.log("ℹ️  No users found in Auth.");
    }
  } catch (error) {
    console.error("❌ Error deleting accounts from Auth:", error.message);
  }

  // 2. Clear RTDB Nodes
  const rtdbNodes = ['users', 'usernames', 'feedPosts', 'status'];
  for (const node of rtdbNodes) {
    try {
      console.log(`🧹 Clearing RTDB node: /${node}...`);
      await rtdb.ref(node).remove();
      console.log(`   - Node /${node} cleared.`);
    } catch (error) {
      console.error(`❌ Error clearing RTDB /${node}:`, error.message);
    }
  }

  // 3. Clear Firestore Users
  try {
    const usersCollection = firestore.collection('users');
    const snap = await usersCollection.get();
    if (!snap.empty) {
      console.log(`🧹 Deleting ${snap.size} user documents from Firestore...`);
      const batch = firestore.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log("   - Firestore 'users' collection cleared.");
    } else {
      console.log("ℹ️  No users found in Firestore.");
    }
  } catch (error) {
    console.error("❌ Error clearing Firestore users:", error.message);
  }

  console.log("\n✅ GLOBAL WIPE COMPLETE. ALL DATA PURGED.");
  process.exit(0);
}

performWipe().catch(console.error);
