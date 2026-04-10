/**
 * hooks/useSocial.ts
 *
 * React hook that manages follow state and followers list
 * with real-time Firestore listeners.
 *
 * Usage:
 *   const { followers, following, isFollowing, follow, unfollow } = useSocial(myUid);
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Friend,
  followUser,
  unfollowUser,
  isFollowing as checkIsFollowing,
  fetchFollowers,
  fetchFollowing,
  onFollowersChanged,
} from '@/services/social';

interface UseSocialReturn {
  followers:    Friend[];
  following:    Friend[];
  isLoadingFollowers: boolean;
  /** Check if myUid follows targetUid (cached from the following list) */
  checkFollowing: (targetUid: string) => boolean;
  /** Follow a user — optimistic UI update */
  follow:   (targetUid: string, targetUsername: string) => Promise<void>;
  /** Unfollow a user — optimistic UI update */
  unfollow: (targetUid: string) => Promise<void>;
  refresh:  () => Promise<void>;
}

export function useSocial(myUid: string | null, myUsername: string | null): UseSocialReturn {
  const [followers, setFollowers]             = useState<Friend[]>([]);
  const [following, setFollowing]             = useState<Friend[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(true);

  // Load following list once + subscribe to real-time followers
  useEffect(() => {
    if (!myUid) {
      setFollowers([]);
      setFollowing([]);
      setIsLoadingFollowers(false);
      return;
    }

    setIsLoadingFollowers(true);

    // One-time fetch for "following"
    fetchFollowing(myUid).then(setFollowing).catch(console.error);

    // Real-time listener for "followers"
    const unsub = onFollowersChanged(myUid, (list) => {
      setFollowers(list);
      setIsLoadingFollowers(false);
    });

    return () => unsub();
  }, [myUid]);

  const checkFollowing = useCallback(
    (targetUid: string) => following.some(f => f.uid === targetUid),
    [following],
  );

  const follow = useCallback(async (targetUid: string, targetUsername: string) => {
    if (!myUid || !myUsername) return;
    // Optimistic update
    setFollowing(prev => [...prev, { uid: targetUid, username: targetUsername, streakDays: 0 }]);
    const result = await followUser(myUid, targetUid, myUsername, targetUsername);
    if (!result.success) {
      // Revert on error
      setFollowing(prev => prev.filter(f => f.uid !== targetUid));
    }
  }, [myUid, myUsername]);

  const unfollow = useCallback(async (targetUid: string) => {
    if (!myUid) return;
    // Optimistic update
    setFollowing(prev => prev.filter(f => f.uid !== targetUid));
    const result = await unfollowUser(myUid, targetUid);
    if (!result.success) {
      // Revert: re-fetch to get accurate state
      fetchFollowing(myUid).then(setFollowing);
    }
  }, [myUid]);

  const refresh = useCallback(async () => {
    if (!myUid) return;
    const [f1, f2] = await Promise.all([fetchFollowers(myUid), fetchFollowing(myUid)]);
    setFollowers(f1);
    setFollowing(f2);
  }, [myUid]);

  return { followers, following, isLoadingFollowers, checkFollowing, follow, unfollow, refresh };
}
