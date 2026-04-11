import * as React from 'react';

import { InstagramTrackerViewProps } from './InstagramTracker.types';

export default function InstagramTrackerView(props: InstagramTrackerViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
