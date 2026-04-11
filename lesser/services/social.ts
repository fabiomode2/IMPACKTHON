/**
 * services/social.ts
 *
 * Complete Firestore Social Service for Lesser.
 *
 * Firestore schema:
 *   /users/{uid}                       — user profile
 *   /users/{uid}/followers/{followerUid} — who follows this user
 *   /users/{uid}/following/{followedUid} — who this user follows
 *   /feedPosts/{postId}                — global activity feed
 *
 * Follow/unfollow are atomic batch writes so both sides stay consistent.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  value?: number;
  type: 'STREAK' | 'USAGE_REDUCTION' | 'TOP_RANK';
  message?: string;
  photoUrl?: string;
  timestamp: string;
}

export interface SocialError {
  success: false;
  error: string;
}

export interface SocialSuccess {
  success: true;
}

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

/**
 * Follow a user.
 * Uses a batch write for atomic consistency:
 *   - /users/{targetUid}/followers/{myUid}  ← target gains a follower
 *   - /users/{myUid}/following/{targetUid}  ← I follow the target
 */
export async function followUser(
  myUid: string,
  targetUid: string,
  myUsername: string,
  targetUsername: string,
): Promise<SocialSuccess | SocialError> {
  try {
    const batch = writeBatch(db);

    // target's followers subcollection
    batch.set(doc(db, 'users', targetUid, 'followers', myUid), {
      uid: myUid,
      username: myUsername,
      followedAt: serverTimestamp(),
    });

    // my following subcollection
    batch.set(doc(db, 'users', myUid, 'following', targetUid), {
      uid: targetUid,
      username: targetUsername,
      followedAt: serverTimestamp(),
    });

    await batch.commit();
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Unfollow a user.
 * Atomic batch delete from both sides.
 */
export async function unfollowUser(
  myUid: string,
  targetUid: string,
): Promise<SocialSuccess | SocialError> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', targetUid, 'followers', myUid));
    batch.delete(doc(db, 'users', myUid, 'following', targetUid));
    await batch.commit();
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Check whether myUid is currently following targetUid.
 */
export async function isFollowing(myUid: string, targetUid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', myUid, 'following', targetUid));
  return snap.exists();
}

// ─── Followers / Following lists ─────────────────────────────────────────────

/**
 * Fetch the list of users who follow {uid}.
 */
export async function fetchFollowers(uid: string): Promise<Friend[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'followers'));
  return snap.docs.map(d => ({
    uid:        d.id,
    username:   d.data().username ?? d.id,
    streakDays: d.data().streakDays ?? 0,
  }));
}

/**
 * Fetch the list of users that {uid} is following.
 */
export async function fetchFollowing(uid: string): Promise<Friend[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'following'));
  return snap.docs.map(d => ({
    uid:        d.id,
    username:   d.data().username ?? d.id,
    streakDays: d.data().streakDays ?? 0,
  }));
}

/**
 * Real-time listener for followers count.
 * Returns an unsubscribe function.
 */
export function onFollowersChanged(
  uid: string,
  callback: (followers: Friend[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'users', uid, 'followers'), snap => {
    callback(snap.docs.map(d => ({
      uid:        d.id,
      username:   d.data().username ?? d.id,
      streakDays: d.data().streakDays ?? 0,
    })));
  });
}

/**
 * Fetch a single user's public profile data.
 */
export async function getUserProfile(uid: string): Promise<Friend | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid:        snap.id,
    username:   data.username ?? 'User',
    streakDays: data.streakDays ?? 0,
  };
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

/**
 * Fetch the global activity feed (most recent 30 posts).
 * This is still kept for discovery if needed, but not used for the primary feed.
 */
export async function fetchGlobalFeed(): Promise<FeedPost[]> {
  const q = query(
    collection(db, 'feedPosts'),
    orderBy('timestamp', 'desc'),
    limit(30),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id:        d.id,
    uid:       d.data().uid,
    username:  d.data().username,
    days:      d.data().days ?? 0,
    message:   d.data().message,
    photoUrl:  d.data().photoUrl,
    timestamp: formatTimestamp(d.data().timestamp?.toDate()),
    type:      d.data().type ?? 'STREAK',
  }));
}

/**
 * Fetch activity updates ONLY from users that {myUid} follows.
 */
export async function fetchFollowedFeed(myUid: string): Promise<FeedPost[]> {
  try {
    // 1. Get the list of following UIDs
    const followingSnap = await getDocs(collection(db, 'users', myUid, 'following'));
    const followingUids = followingSnap.docs.map(doc => doc.id);

    // If I follow nobody, return empty
    if (followingUids.length === 0) return [];

    // Firestore 'in' query supports up to 30 elements.
    // In a real large-scale app, we'd use a fan-out approach.
    const chunks = [];
    for (let i = 0; i < followingUids.length; i += 30) {
      chunks.push(followingUids.slice(i, i + 30));
    }

    let allPosts: FeedPost[] = [];
    for (const chunk of chunks) {
      const q = query(
        collection(db, 'feedPosts'),
        where('uid', 'in', chunk),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      const posts = snap.docs.map(d => ({
        id:        d.id,
        uid:       d.data().uid,
        username:  d.data().username,
        days:      d.data().days ?? 0,
        message:   d.data().message,
        photoUrl:  d.data().photoUrl,
        timestamp: formatTimestamp(d.data().timestamp?.toDate()),
        type:      d.data().type ?? 'STREAK',
      }));
      allPosts = [...allPosts, ...posts];
    }

    // Sort combined results by time (since multiple queries might be slightly out of order)
    // For simplicity, we'll just return the combined list and rely on Firestore's desc order per chunk.
    return allPosts.sort((a, b) => (b.id > a.id ? 1 : -1)).slice(0, 30);
  } catch (err) {
    console.error('fetchFollowedFeed error:', err);
    return [];
  }
}

/**
 * Post an achievement update.
 */
export async function postAchievement(
  uid: string,
  username: string,
  type: 'STREAK' | 'USAGE_REDUCTION' | 'TOP_RANK',
  value: number,
  message?: string,
): Promise<SocialSuccess | SocialError> {
  try {
    // Prevent duplicate achievement posts for the same day/milestone
    // (Optional: Implement a throttle or check)
    await addDoc(collection(db, 'feedPosts'), {
      uid,
      username,
      type,
      days: type === 'STREAK' ? value : 0,
      value: type !== 'STREAK' ? value : 0,
      message: message ?? null,
      timestamp: serverTimestamp(),
    });
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

// ─── User search ──────────────────────────────────────────────────────────────

/**
 * Search users by username prefix (case-insensitive Firestore range query).
 */
export async function searchUsers(usernamePrefix: string): Promise<Friend[]> {
  const prefix = usernamePrefix.toLowerCase(); // Ensure search is case-insensitive if data is lowercased
  if (prefix.length < 1) return [];

  const q = query(
    collection(db, 'users'),
    where('username_lowercase', '>=', prefix),
    where('username_lowercase', '<=', prefix + '\uf8ff'),
    limit(15),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    uid:        d.id,
    username:   d.data().username,
    streakDays: d.data().streakDays ?? 0,
  }));
}

/**
 * Check if the user has reached a milestone today and post it.
 * This should be called on app start or when stats update.
 */
export async function checkAndPostMilestones(
  uid: string,
  username: string,
  streakDays: number,
  topPercentage: number,
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `last_post_${uid}`;
    
    // In a real app, we'd store this in Firestore as a 'lastAchievementDate'
    // For this prototype, we'll use a unique identifier for the achievement
    // to search if it was already posted in the feed.
    
    // Check if we already posted a streak achievement for this exact number of days
    const q = query(
      collection(db, 'feedPosts'),
      where('uid', '==', uid),
      where('type', '==', 'STREAK'),
      where('days', '==', streakDays),
      limit(1)
    );
    const snap = await getDocs(q);
    
    if (snap.empty && streakDays > 0 && streakDays % 5 === 0) {
      // Post every 5 days of streak
      await postAchievement(uid, username, 'STREAK', streakDays);
    }
    
    // Also post if user hits a top rank milestone
    if (topPercentage <= 10) {
        const qRank = query(
            collection(db, 'feedPosts'),
            where('uid', '==', uid),
            where('type', '==', 'TOP_RANK'),
            where('value', '==', topPercentage),
            limit(1)
        );
        const rankSnap = await getDocs(qRank);
        if (rankSnap.empty) {
            await postAchievement(uid, username, 'TOP_RANK', topPercentage);
        }
    }
  } catch (err) {
    console.error('Milestone check failed:', err);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(date?: Date): string {
  if (!date) return 'Justo ahora';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}
