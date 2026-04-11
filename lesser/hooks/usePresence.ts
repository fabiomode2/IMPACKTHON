import { useEffect } from 'react';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { rtdb } from '@/services/firebase';

export function usePresence(uid: string | null | undefined) {
  useEffect(() => {
    if (!uid) return;

    // References
    const userStatusDatabaseRef = ref(rtdb, `/status/${uid}`);
    const connectedRef = ref(rtdb, '.info/connected');

    // States to sync
    const isOfflineForDatabase = {
      state: 'offline',
      last_changed: serverTimestamp(),
    };

    const isOnlineForDatabase = {
      state: 'online',
      last_changed: serverTimestamp(),
    };

    // Listen to network connection state
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) {
        return; // Not connected
      }

      // If connected, setup the onDisconnect hook so Firebase updates it
      // automatically if the client's connection is lost or tab closed.
      onDisconnect(userStatusDatabaseRef)
        .set(isOfflineForDatabase)
        .then(() => {
          // If the disconnect hook was successfully established,
          // it's safe to mark the user as 'online'.
          set(userStatusDatabaseRef, isOnlineForDatabase);
        })
        .catch((error) => {
           console.error("Could not set presence:", error);
        });
    });

    return () => {
      // Cleanup: Mark offline immediately when component unmounts (e.g. logging out)
      set(userStatusDatabaseRef, isOfflineForDatabase);
      unsubscribe();
    };
  }, [uid]);
}
