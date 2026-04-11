import { NativeModule, requireNativeModule } from 'expo';

declare class InstagramTrackerModule extends NativeModule {
  hasUsagePermission(): boolean;
  requestUsagePermission(): void;
  getInstagramUsageToday(): number;
  isInstagramInForeground(): boolean;
  startVigilante(): void;
  stopVigilante(): void;

export default requireNativeModule<InstagramTrackerModule>('InstagramTracker');
