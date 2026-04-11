import { Platform, NativeModules } from 'react-native';
import { fetchSettings } from './settings';
import { auth } from './firebase';

let VolumeManager: any;
try {
  VolumeManager = require('react-native-volume-manager').VolumeManager;
} catch (e) {
  VolumeManager = null;
}

const { OverlayModule } = NativeModules;

class SilentNudgeService {
  private isPunishing: boolean = false;
  private originalVolume: number = 0.5;

  public async tickBackground() {
    if (Platform.OS !== 'android') return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const settings = await fetchSettings(user.uid);
        
        // Aquí la app idealmente leería el tiempo total de uso de otro tracker.
        // Como proof-of-concept, si está en modo soft y el nudge encendido,
        // lo lanzamos para demostrar el funcionamiento del overlay en el background.
        if (settings.mode === 'soft' && settings.silentNudgeEnabled) {
            await this.applyPunishment();
        } else {
            await this.stopPunishment();
        }
    } catch (e) {
        console.warn("Failed fetch settings in tick", e);
    }
  }

  public async applyPunishment() {
    if (this.isPunishing) return;
    this.isPunishing = true;
    console.log('[SilentNudge] Aplicando Castigo (Mute + Overlay)...');

    // 1. Mostrar el overlay
    if (OverlayModule) {
      try {
        await OverlayModule.startOverlay();
      } catch (e) {
        console.error("Overlay no concedido: ", e);
      }
    }

    // 2. Mute audio
    if (VolumeManager) {
        try {
            const volumeState = await VolumeManager.getVolume();
            this.originalVolume = typeof volumeState === 'number' ? volumeState : (volumeState as any).music || 0.5;
            await VolumeManager.setVolume(0, { type: 'music' });
        } catch (e) {}
    }
  }

  public async stopPunishment() {
    if (!this.isPunishing) return;
    this.isPunishing = false;
    console.log('[SilentNudge] Quitanto Castigo...');

    // 1. Quitar Overlay
    if (OverlayModule) {
       try {
           await OverlayModule.stopOverlay();
       } catch (e) {}
    }

    // 2. Restaurar Volumen
    if (VolumeManager) {
        try {
            await VolumeManager.setVolume(this.originalVolume, { type: 'music' });
        } catch(e) {}
    }
  }
}

export const silentNudgeService = new SilentNudgeService();
