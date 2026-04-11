// Reexport the native module. On web, it will be resolved to InstagramTrackerModule.web.ts
// and on native platforms to InstagramTrackerModule.ts
export { default } from './src/InstagramTrackerModule';
export { default as InstagramTrackerView } from './src/InstagramTrackerView';
export * from  './src/InstagramTracker.types';
