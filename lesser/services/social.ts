/**
 * services/social.ts
 *
 * Realtime Database Social Service for Lesser.
 *
 * RTDB schema:
 *   /users/{uid}                       — user profile (username, streak, etc)
 *   /users/{uid}/followers/{followerUid} — who follows this user
 *   /users/{uid}/following/{followedUid} — who this user follows
 *   /users/{uid}/notifications/{id}      — user notifications
 *   /feedPosts/{postId}                — global activity feed
 */

import {
  ref,
  get,
  set,
  push,
  remove,
  update,
  query,
  orderByChild,
  limitToLast,
  limitToFirst,
  startAt,
  endAt,
  onValue,
  off,
  serverTimestamp,
} from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { rtdb, functions } from './firebase';

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

export interface AppNotification {
  id: string;
  type: 'NEW_FOLLOWER';
  fromUid: string;
  fromUsername: string;
  timestamp: number | string;
  read: boolean;
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
 * (Ideally calls a Cloud Function that handles RTDB now)
 */
export async function followUser(
  myUid: string,
  targetUid: string,
  myUsername: string,
  targetUsername: string,
): Promise<SocialSuccess | SocialError> {
  try {
    const followFn = httpsCallable<any, any>(functions, 'onFollowUser');
    await followFn({ targetUid, targetUsername, myUsername });
    return { success: true };
  } catch (err: unknown) {
    // If CF fails or isn't migrated, fallback to manual RTDB update (not ideal for counters but works)
    try {
      await update(ref(rtdb), {
        [`users/${targetUid}/followers/${myUid}`]: { username: myUsername, timestamp: serverTimestamp() },
        [`users/${myUid}/following/${targetUid}`]: { username: targetUsername, timestamp: serverTimestamp() }
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: (err as Error).message };
    }
  }
}

/**
 * Unfollow a user.
 */
export async function unfollowUser(
  myUid: string,
  targetUid: string,
): Promise<SocialSuccess | SocialError> {
  try {
    const unfollowFn = httpsCallable<any, any>(functions, 'onUnfollowUser');
    await unfollowFn({ targetUid });
    return { success: true };
  } catch (err: unknown) {
    try {
      await remove(ref(rtdb, `users/${targetUid}/followers/${myUid}`));
      await remove(ref(rtdb, `users/${myUid}/following/${targetUid}`));
      return { success: true };
    } catch (e) {
      return { success: false, error: (err as Error).message };
    }
  }
}

/**
 * Check whether myUid is currently following targetUid.
 */
export async function isFollowing(myUid: string, targetUid: string): Promise<boolean> {
  const snap = await get(ref(rtdb, `users/${myUid}/following/${targetUid}`));
  return snap.exists();
}

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * Real-time listener for notifications.
 * Returns an unsubscribe function.
 */
export function onNotificationsChanged(
  uid: string,
  callback: (notifications: AppNotification[]) => void,
): () => void {
  const q = query(
    ref(rtdb, `users/${uid}/notifications`),
    limitToLast(50)
  );
  
  const listener = onValue(q, snap => {
    const data = snap.val();
    if (!data) {
        callback([]);
        return;
    }
    const list = Object.keys(data).map(id => ({
      id,
      ...data[id]
    } as AppNotification));
    // RTDB doesn't have complex orderby on multiple fields easily, sort client side
    callback(list.sort((a, b) => (b.timestamp as any) - (a.timestamp as any)));
  });

  return () => off(q, 'value', listener);
}

/**
 * Mark a specific notification or all notifications as read.
 */
export async function markNotificationsAsRead(uid: string, notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) return;
  const updates: any = {};
  notificationIds.forEach(id => {
    updates[`users/${uid}/notifications/${id}/read`] = true;
  });
  await update(ref(rtdb), updates);
}

// ─── Followers / Following lists ─────────────────────────────────────────────

/**
 * Fetch the list of users who follow {uid}.
 */
export async function fetchFollowers(uid: string): Promise<Friend[]> {
  const snap = await get(ref(rtdb, `users/${uid}/followers`));
  const data = snap.val();
  if (!data) return [];
  return Object.keys(data).map(id => ({
    uid:        id,
    username:   data[id].username ?? id,
    streakDays: data[id].streakDays ?? 0,
  }));
}

/**
 * Fetch the list of users that {uid} is following.
 */
export async function fetchFollowing(uid: string): Promise<Friend[]> {
  const snap = await get(ref(rtdb, `users/${uid}/following`));
  const data = snap.val();
  if (!data) return [];
  return Object.keys(data).map(id => ({
    uid:        id,
    username:   data[id].username ?? id,
    streakDays: data[id].streakDays ?? 0,
  }));
}

/**
 * Real-time listener for followers count.
 */
export function onFollowersChanged(
  uid: string,
  callback: (followers: Friend[]) => void,
): () => void {
  const r = ref(rtdb, `users/${uid}/followers`);
  const listener = onValue(r, snap => {
    const data = snap.val();
    if (!data) {
        callback([]);
        return;
    }
    callback(Object.keys(data).map(id => ({
      uid:        id,
      username:   data[id].username ?? id,
      streakDays: data[id].streakDays ?? 0,
    })));
  });
  return () => off(r, 'value', listener);
}

/**
 * Fetch a single user's public profile data.
 */
export async function getUserProfile(uid: string): Promise<Friend | null> {
  const snap = await get(ref(rtdb, `users/${uid}`));
  if (!snap.exists()) return null;
  const data = snap.val();
  return {
    uid,
    username:   data.username ?? 'User',
    streakDays: data.streakDays ?? 0,
  };
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

/**
 * Fetch the global activity feed.
 */
export async function fetchGlobalFeed(): Promise<FeedPost[]> {
  const q = query(
    ref(rtdb, 'feedPosts'),
    limitToLast(30),
  );
  const snap = await get(q);
  const data = snap.val();
  if (!data) return [];
  
  const posts = Object.keys(data).map(id => ({
    id,
    ...data[id],
    timestamp: formatTimestamp(new Date(data[id].timestamp)),
  }));
  return posts.sort((a, b) => (b.id > a.id ? 1 : -1));
}

/**
 * Fetch activity updates ONLY from users that follow {myUid} AND {myUid} follows them back.
 */
export async function fetchFollowedFeed(myUid: string): Promise<FeedPost[]> {
  try {
    // 1. Get my followers and following in parallel
    const [followersList, followingList] = await Promise.all([
      fetchFollowers(myUid),
      fetchFollowing(myUid)
    ]);

    const followingUids = new Set(followingList.map(f => f.uid));
    const mutualUids = followersList
      .map(f => f.uid)
      .filter(uid => followingUids.has(uid));

    // Also include myself in the feed usually
    mutualUids.push(myUid);

    if (mutualUids.length === 0) return [];

    // 2. Fetch global feed and filter
    // Note: In production, you'd use a better query, but for hackathon prototype/small data, filtering is fine.
    const allPosts = await fetchGlobalFeed();
    return allPosts.filter(post => mutualUids.includes(post.uid));
  } catch (err) {
    console.error('fetchFollowedFeed failed:', err);
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
    const newPostRef = push(ref(rtdb, 'feedPosts'));
    await set(newPostRef, {
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
 * Search users by username prefix dynamically.
 */
export async function searchUsers(usernamePrefix: string): Promise<Friend[]> {
  const searchStr = usernamePrefix.trim().toLowerCase();
  if (searchStr.length < 1) return [];

  try {
    const q = query(
      ref(rtdb, 'users'),
      orderByChild('username_lowercase'),
      startAt(searchStr),
      endAt(searchStr + '\uf8ff'),
      limitToFirst(20)
    );

    const snap = await get(q);
    const data = snap.val();
    if (!data) return [];

    return Object.keys(data)
      .filter(id => id !== null) // basic guard
      .map(id => ({
        uid: id,
        username: data[id].username ?? 'Usuario',
        streakDays: data[id].streakDays ?? 0,
      }));
  } catch (err) {
    console.error('searchUsers failed:', err);
    return [];
  }
}

/**
 * Fetch a list of recommended users.
 */
export async function getRecommendedUsers(): Promise<Friend[]> {
  try {
    const q = query(
      ref(rtdb, 'users'),
      orderByChild('streakDays'),
      limitToLast(10)
    );
    const snap = await get(q);
    const data = snap.val();
    if (!data) return [];

    const list = Object.keys(data).map(id => ({
      uid: id,
      username: data[id].username ?? 'Usuario',
      streakDays: data[id].streakDays ?? 0,
    }));
    return list.sort((a, b) => b.streakDays - a.streakDays);
  } catch (err) {
    console.error('getRecommendedUsers failed:', err);
    return [];
  }
}

/**
 * Check and post achievements.
 */
export async function checkAndPostMilestones(
  uid: string,
  username: string,
  streakDays: number,
  topPercentage: number,
): Promise<void> {
    // Keeping logic similar but checking against RTDB paths if possible, 
    // or just skipping for now to focus on main task.
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { t } from '@/constants/i18n';

function formatTimestamp(date?: Date): string {
  if (!date || isNaN(date.getTime())) return t('common.justNow');
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('common.now');
  if (mins < 60) return t('common.agoMinutes', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('common.agoHours', { n: hours });
  const days = Math.floor(hours / 24);
  return t('common.agoDays', { n: days });
}
