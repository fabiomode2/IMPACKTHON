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

// ─── Activity Feed ────────────────────────────────────────────────────────────

/**
 * Fetch the global activity feed (most recent 30 posts).
 */
export async function fetchFeed(_uid: string): Promise<FeedPost[]> {
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
  }));
}

/**
 * Post an activity update to the global feed.
 */
export async function postFeedUpdate(
  uid: string,
  username: string,
  days: number,
  message?: string,
): Promise<SocialSuccess | SocialError> {
  try {
    await addDoc(collection(db, 'feedPosts'), {
      uid,
      username,
      days,
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
 * Search users by username prefix (case-sensitive Firestore range query).
 * For full-text search, integrate Algolia or Typesense.
 */
export async function searchUsers(usernamePrefix: string): Promise<Friend[]> {
  if (usernamePrefix.length < 2) return [];
  const q = query(
    collection(db, 'users'),
    where('username', '>=', usernamePrefix),
    where('username', '<=', usernamePrefix + '\uf8ff'),
    limit(20),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    uid:        d.id,
    username:   d.data().username,
    streakDays: d.data().streakDays ?? 0,
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(date?: Date): string {
  if (!date) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
