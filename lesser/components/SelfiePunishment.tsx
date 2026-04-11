import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

let InstagramTrackerModule: any = null;
try {
  InstagramTrackerModule = require('../../modules/instagram-tracker').default;
} catch (e) {}

// A hidden component that mounts the camera for a split second to take a punishment selfie
export default function SelfiePunishment() {
  const cameraRef = useRef<any>(null);
  const [shouldMountCamera, setShouldMountCamera] = useState(false);
  
  // Permissions are requested automatically if missing in an optimal scenario, 
  // but since we are doing it in the background/foreground boundary, we check first
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [mediaPerm, requestMediaPerm] = MediaLibrary.usePermissions();

  useEffect(() => {
    if (!InstagramTrackerModule || Platform.OS !== 'android') return;

    // Listen to the native event fired from our Vigilante Thread
    const subscription = InstagramTrackerModule.addListener('onPunishmentTriggered', async () => {
      console.log("PUNISHMENT TRIGGERED! Requesting permissions and mounting camera...");
      
      // Request permissions
      if (!camPerm?.granted) await requestCamPerm();
      if (!mediaPerm?.granted) await requestMediaPerm();

      // Mount the camera view
      setShouldMountCamera(true);
    });

    return () => {
      subscription.remove();
    };
  }, [camPerm, mediaPerm]);

  const handleCameraReady = async () => {
    if (cameraRef.current) {
      try {
        console.log("CAMERA READY. Taking picture...");
        const photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
            base64: false,
        });

        if (photo?.uri) {
           console.log("Picture taken! Saving to library...", photo.uri);
           await MediaLibrary.saveToLibraryAsync(photo.uri);
           console.log("Saved to Gallery Successfully.");
        }
      } catch (e) {
        console.error("Failed to take photo", e);
      } finally {
        // Unmount camera to save resources and hide the view
        setShouldMountCamera(false);
      }
    }
  };

  if (!shouldMountCamera) return null;

  // We place the camera outside of the visible screen to avoid UI disruption
  // Or we make it 1x1 pixel Absolute
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
    top: -1000, 
    left: -1000,
    width: 10,
    height: 10,
    overflow: 'hidden',
    opacity: 0,
  },
  camera: {
    flex: 1,
  }
});
