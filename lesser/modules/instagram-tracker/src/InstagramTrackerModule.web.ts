import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './InstagramTracker.types';

type InstagramTrackerModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class InstagramTrackerModule extends NativeModule<InstagramTrackerModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(InstagramTrackerModule, 'InstagramTrackerModule');
