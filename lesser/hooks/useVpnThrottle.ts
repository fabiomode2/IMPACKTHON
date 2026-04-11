import { NativeModules, Platform } from 'react-native';

const { ThrottleVpn } = NativeModules;

/**
 * Apps to throttle by default.
 */
export const DEFAULT_BLACKLIST = [
  'com.instagram.android',
  'com.zhiliaoapp.musically',   // TikTok
  'com.twitter.android',
  'com.facebook.katana',
  'com.snapchat.android',
  'com.reddit.frontpage',
  'com.google.android.youtube',
];

/**
 * Hook or service to control the VPN Throttling.
 */
export const VpnThrottle = {
  /**
   * Starts the VPN with the given packages.
   * On Android, this will trigger the system VPN permission dialog if not already granted.
   */
  start: async (packages: string[] = DEFAULT_BLACKLIST): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    try {
      const result = await ThrottleVpn.startVpn(packages);
      return result === 'started';
    } catch (error) {
      console.warn('VpnThrottle.start failed:', error);
      return false;
    }
  },

  /**
   * Stops the VPN service.
   */
  stop: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    try {
      const result = await ThrottleVpn.stopVpn();
      return result === 'stopped';
    } catch (error) {
      console.error('VpnThrottle.stop failed:', error);
      return false;
    }
  },

  /**
   * Gets the current artificial delay in milliseconds.
   */
  getCurrentDelay: async (): Promise<number> => {
    if (Platform.OS !== 'android') return 0;
    try {
      return await ThrottleVpn.getCurrentDelay();
    } catch (error) {
      return 0;
    }
  }
};
