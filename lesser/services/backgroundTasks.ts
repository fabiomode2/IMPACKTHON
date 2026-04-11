import { Platform, NativeModules } from 'react-native';
import BackgroundJob from 'react-native-background-actions';
import { silentNudgeService } from './silentNudgeService';

/**
 * services/backgroundTasks.ts
 *
 * Registration of persistent foreground service for the app.
 */

const { OverlayModule } = NativeModules;

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

// Esta es la tarea que corrrerá eternamente en segundo plano.
const backgroundTask = async (taskDataArguments: any) => {
    // Al arrancar el servicio en segundo plano, empezamos el bucle de "SilentNudge".
    // Esto mantendrá la app viva y ejecutará la lógica de reducción de volumen o pantalla apagada.
    await new Promise<void>(async (resolve) => {
        // En un caso real, el Loop debe reaccionar a un tracker. 
        // Como simplificación inicial, encendemos el modo debugLoop para que actúe indefinidamente
        // o llamamos al nudgeService a que evalúe periodicamente.
        
        while (BackgroundJob.isRunning()) {
            // Emulamos notificar uso, esto internamente decidirá si se apaga audio o lanza overlay
            // Llamamos a la lógica conectando el overlay aquí en vez de solo volumen:
            await silentNudgeService.tickBackground();
            
            await sleep(10000); // Evalúa cada 10 segundos
        }
        resolve();
    });
};

const options = {
    taskName: 'LesserBackgroundMonitor',
    taskTitle: 'Monitor de Uso Activo',
    taskDesc: 'Evaluando tiempo de pantalla',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#000000',
    linkingURI: 'lesser://chat/jane',
    parameters: {
        delay: 5000,
    },
};

export async function registerAllBackgroundTasks() {
  if (Platform.OS !== 'android') return;
  
  if (!BackgroundJob.isRunning()) {
      try {
          console.log("Iniciando Foreground Service...");
          await BackgroundJob.start(backgroundTask, options);
      } catch (e) {
          console.error("No se pudo iniciar el background job", e);
      }
  }
}

export function stopBackgroundTasks() {
    if (BackgroundJob.isRunning()) {
        BackgroundJob.stop();
        if (OverlayModule) OverlayModule.stopOverlay();
    }
}
