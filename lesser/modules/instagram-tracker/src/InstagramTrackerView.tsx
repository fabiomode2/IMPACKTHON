import { requireNativeView } from 'expo';
import * as React from 'react';

import { InstagramTrackerViewProps } from './InstagramTracker.types';

const NativeView: React.ComponentType<InstagramTrackerViewProps> =
  requireNativeView('InstagramTracker');

export default function InstagramTrackerView(props: InstagramTrackerViewProps) {
  return <NativeView {...props} />;
}
