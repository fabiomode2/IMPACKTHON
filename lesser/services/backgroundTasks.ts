import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { silentNudgeService } from './silentNudgeService';

/**
 * services/backgroundTasks.ts
 *
 * Registration of background tasks for the app.
 */

export const SILENT_NUDGE_TASK = 'BACKGROUND_SILENT_NUDGE';

if (Platform.OS === 'android') {
  TaskManager.defineTask(SILENT_NUDGE_TASK, async ({ data, error, executionContext }) => {
    if (error) {
      console.error('[BackgroundTasks] Error in silent nudge task:', error);
      return;
    }
    
    // This is where external foreground monitoring would plug in.
    // For now, it keeps the service context alive.
    // Note: To keep a loop running reliably on Android while the app is backgrounded,
    // a Foreground Service is often preferred over simple BackgroundFetch.
  });
}

export async function registerAllBackgroundTasks() {
  if (Platform.OS !== 'android') return;
  
  // Note: Actual task invocation often happens via BackgroundFetch or 
  // custom native triggers. For now, we define the task so it's ready.
}
