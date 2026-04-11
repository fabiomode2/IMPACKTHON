import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

let InstagramTrackerModule: any = null;
try {
  InstagramTrackerModule = require('../../modules/instagram-tracker').default;
} catch (e) {}

// Hidden component that listens for the native "onPunishmentTriggered" event,
// mounts the front camera briefly, takes a silent photo, and saves it to the gallery.
export default function SelfiePunishment() {
  const cameraRef = useRef<any>(null);
  const [shouldMountCamera, setShouldMountCamera] = useState(false);

  // Permissions hooks
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [mediaPerm, requestMediaPerm] = MediaLibrary.usePermissions();

  // Keep always-fresh refs to avoid stale closures inside the listener (bug fix #6)
  const camPermRef = useRef(camPerm);
  const mediaPermRef = useRef(mediaPerm);
  useEffect(() => { camPermRef.current = camPerm; }, [camPerm]);
  useEffect(() => { mediaPermRef.current = mediaPerm; }, [mediaPerm]);

  // Request both permissions on mount so they are already granted when the event fires.
  // Requesting at event-time is unreliable because at that moment the app is transitioning
  // from background to foreground and the permission dialog may not display correctly.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    (async () => {
      if (!camPerm?.granted) await requestCamPerm();
      if (!mediaPerm?.granted) await requestMediaPerm();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run only once on mount

  // Register the native event listener exactly once (bug fix #5 — deps was [camPerm, mediaPerm])
  useEffect(() => {
    if (!InstagramTrackerModule || Platform.OS !== 'android') return;

    const subscription = InstagramTrackerModule.addListener(
      'onPunishmentTriggered',
      async () => {
        console.log('[SelfiePunishment] Event received — mounting camera...');

        // If permissions somehow still not granted, try one last time
        if (!camPermRef.current?.granted) await requestCamPerm();
        if (!mediaPermRef.current?.granted) await requestMediaPerm();

        // Mounting the CameraView will trigger onCameraReady when hardware is ready
        setShouldMountCamera(true);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []); // mount once, never re-register

  const handleCameraReady = async () => {
    if (!cameraRef.current) return;
    try {
      console.log('[SelfiePunishment] Camera ready — taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
        skipProcessing: true, // faster capture
      });

      if (photo?.uri) {
        console.log('[SelfiePunishment] Photo taken — saving to gallery:', photo.uri);
        await MediaLibrary.saveToLibraryAsync(photo.uri);
        console.log('[SelfiePunishment] Saved successfully.');
      }
    } catch (e) {
      console.error('[SelfiePunishment] Failed to take/save photo:', e);
    } finally {
      // Always unmount the camera to release hardware resources
      setShouldMountCamera(false);
    }
  };

  // When not capturing, render nothing at all
  if (!shouldMountCamera) return null;

  // The container is rendered off-screen and fully transparent so the user
  // never sees the camera preview flicker. We still need a non-zero size so
  // the native camera hardware initialises properly.
  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        onCameraReady={handleCameraReady}
        mute={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    // Moved far off-screen so it's invisible without using opacity:0
    // (some Android vendors skip camera init when opacity is 0)
    top: -2000,
    left: -2000,
    width: 64,   // non-trivial size so the camera sensor initialises
    height: 64,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
});
