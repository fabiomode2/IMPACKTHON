/**
 * services/social.ts
 *
 * Firebase-ready Social Service.
 * Currently returns mock data. Replace with Firestore calls.
 *
 * Firebase integration points are marked with: // [FIREBASE]
 */

export interface Friend {
  uid: string;
  username: string;
  streakDays: number;
}

export interface FeedPost {
  id: string;
  uid: string;
  username: string;
  days: number;
  message?: string;
  photoUrl?: string;
  timestamp: string;
}

/**
 * Fetch the social feed for a user (posts from friends).
 * Replace with Firestore query on 'feed' collection ordered by timestamp.
 */
export async function fetchFeed(_uid: string): Promise<FeedPost[]> {
  // [FIREBASE] const q = query(collection(db, 'users', uid, 'feed'), orderBy('timestamp', 'desc'), limit(20));
  // [FIREBASE] const snap = await getDocs(q);
  // [FIREBASE] return snap.docs.map(d => ({ id: d.id, ...d.data() })) as FeedPost[];

  await new Promise(r => setTimeout(r, 200));
  return [
    {
      id: '1',
      uid: 'u1',
      username: 'AlexRodriguez',
      days: 14,
      timestamp: '2 hours ago',
      message: '¡Poco a poco se nota la diferencia! Más concentración y mejor sueño.',
    },
    {
      id: '2',
      uid: 'u2',
      username: 'Maria_99',
      days: 3,
      timestamp: '5 hours ago',
      photoUrl:
        'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: '3',
      uid: 'u3',
      username: 'Carlos_Dev',
      days: 30,
      timestamp: '1 day ago',
      message: 'Un mes completo en Hardcore Mode. Al principio costó, pero merece la pena.',
    },
  ];
}

/**
 * Fetch the friends list for a user.
 * Replace with Firestore query on user's 'friends' subcollection.
 */
export async function fetchFriends(_uid: string): Promise<Friend[]> {
  // [FIREBASE] const snap = await getDocs(collection(db, 'users', uid, 'friends'));
  // [FIREBASE] return snap.docs.map(d => ({ uid: d.id, ...d.data() })) as Friend[];

  await new Promise(r => setTimeout(r, 150));
  return [
    { uid: 'u1', username: 'AlexRodriguez', streakDays: 14 },
    { uid: 'u2', username: 'Maria_99', streakDays: 3 },
    { uid: 'u3', username: 'Carlos_Dev', streakDays: 30 },
    { uid: 'u4', username: 'Sara_M', streakDays: 7 },
  ];
}

/**
 * Send a friend request.
 * Replace with Firestore write.
 */
export async function sendFriendRequest(_fromUid: string, _toUsername: string): Promise<boolean> {
  // [FIREBASE] await addDoc(collection(db, 'friendRequests'), { from: fromUid, toUsername, createdAt: serverTimestamp() });
  await new Promise(r => setTimeout(r, 300));
  return true;
}
