import { Platform } from 'react-native';
// Safe import for VolumeManager to prevent crashes in environments where it's not linked (like Expo Go)
let VolumeManager: any;
try {
  VolumeManager = require('react-native-volume-manager').VolumeManager;
} catch (e) {
  VolumeManager = null;
}
import { fetchSettings } from './settings';
import { auth } from './firebase';

/**
 * services/silentNudgeService.ts
 *
 * Handles the periodic muting logic for Soft Mode on Android.
 * Designed to be modular for easy connection to foreground app detection.
 */

class SilentNudgeService {
  private isLooping: boolean = false;
  private isDebugLooping: boolean = false;
  private currentUsageMinutes: number = 0;
  private originalVolume: number = 0.5;

  /**
   * Called by the foreground detection logic (to be implemented).
   * @param minutes Current continuous session duration.
   */
  public async notifyForegroundUsage(minutes: number) {
    if (Platform.OS !== 'android') return;
    
    this.currentUsageMinutes = minutes;
    const user = auth.currentUser;
    if (!user) return;

    const settings = await fetchSettings(user.uid);
    
    if (settings.mode === 'soft' && settings.silentNudgeEnabled) {
      if (minutes >= settings.silentNudgeThreshold) {
        this.startLoop();
      } else {
        this.stopLoop();
      }
    } else {
      this.stopLoop();
    }
  }

  /**
   * Toggles the debug muting loop (30s on / 30s off).
   * Does not depend on mode or usage threshold.
   */
  public toggleDebugMode(enabled: boolean) {
    if (Platform.OS !== 'android') return;
    
    if (enabled) {
      if (this.isDebugLooping) return;
      this.isDebugLooping = true;
      console.log('[SilentNudge] Starting DEBUG loop...');
      this.runDebugLoop();
    } else {
      this.isDebugLooping = false;
      console.log('[SilentNudge] Stopping DEBUG loop...');
      this.restoreVolume();
    }
  }

  private async startLoop() {
    if (this.isLooping) return;
    this.isLooping = true;
    console.log('[SilentNudge] Starting loop...');
    this.runLoop();
  }

  private stopLoop() {
    if (!this.isLooping) return;
    this.isLooping = false;
    console.log('[SilentNudge] Stopping loop...');
    this.restoreVolume();
  }

  private async runLoop() {
    while (this.isLooping) {
      // 1. Wait 3-5 minutes (randomised)
      const waitTime = this.getRandomInRange(3 * 60 * 1000, 5 * 60 * 1000);
      await this.sleep(waitTime);
      if (!this.isLooping) break;

      // 2. Mute (Media stream)
      if (VolumeManager) {
        console.log('[SilentNudge] Muting media...');
        const volumeState = await VolumeManager.getVolume();
        this.originalVolume = typeof volumeState === 'number' ? volumeState : (volumeState as any).music || 0.5;
        await VolumeManager.setVolume(0, { type: 'music' });
      } else {
        console.log('[SilentNudge] VolumeManager unlinked - skipping mute');
      }

      // 3. Wait 20-40 seconds (randomised)
      const silentTime = this.getRandomInRange(20 * 1000, 40 * 1000);
      await this.sleep(silentTime);
      if (!this.isLooping) break;

      // 4. Unmute
      if (VolumeManager) {
        console.log('[SilentNudge] Restoring media volume...');
        await VolumeManager.setVolume(this.originalVolume, { type: 'music' });
      }
    }
  }

  private async restoreVolume() {
    try {
      if (VolumeManager) {
        await VolumeManager.setVolume(this.originalVolume, { type: 'music' });
      }
    } catch (e) {
      console.warn('[SilentNudge] Failed to restore volume', e);
    }
  }

  private async runDebugLoop() {
    while (this.isDebugLooping) {
      // 1. Wait 30s
      await this.sleep(30 * 1000);
      if (!this.isDebugLooping) break;

      // 2. Mute (Media stream)
      if (VolumeManager) {
        console.log('[SilentNudge] DEBUG: Muting media...');
        const volumeState = await VolumeManager.getVolume();
        this.originalVolume = typeof volumeState === 'number' ? volumeState : (volumeState as any).music || 0.5;
        await VolumeManager.setVolume(0, { type: 'music' });
      }

      // 3. Wait 30s
      await this.sleep(30 * 1000);
      if (!this.isDebugLooping) break;

      // 4. Unmute
      if (VolumeManager) {
        console.log('[SilentNudge] DEBUG: Restoring media volume...');
        await VolumeManager.setVolume(this.originalVolume, { type: 'music' });
      }
    }
  }

  private getRandomInRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const silentNudgeService = new SilentNudgeService();
