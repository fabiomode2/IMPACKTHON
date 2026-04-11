import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_TIME = '@app_active_time';
const STORAGE_KEY_LAST_SEEN = '@app_last_seen_timestamp';

// Definimos los límites del contador en milisegundos
const MAX_TIME_MS = 6 * 3600 * 1000; // 6 horas en milisegundos
const MIN_TIME_MS = 0;               // 0 horas

export function useAppTimeTracker() {
  const [activeTimeMs, setActiveTimeMs] = useState<number>(0);
  
  // Referencias para no perder el estado actual dentro de los clousures (Intervalos y listeners)
  const appState = useRef(AppState.currentState);
  const activeTimeRef = useRef<number>(0);

  // Carga inicial y cálculo de la diferencia del tiempo transcurrido desde el último uso
  useEffect(() => {
    const initializeTracker = async () => {
      try {
        const storedTime = await AsyncStorage.getItem(STORAGE_KEY_TIME);
        const storedLastSeen = await AsyncStorage.getItem(STORAGE_KEY_LAST_SEEN);
        
        let currentTime = storedTime ? parseInt(storedTime, 10) : 0;
        
        if (storedLastSeen) {
          const lastSeenMs = parseInt(storedLastSeen, 10);
          const nowMs = Date.now();
          const offlineElapsed = Math.max(0, nowMs - lastSeenMs);
          
          // Se reduce 3 veces más lento (es decir, el paso offline / 3)
          const reduction = offlineElapsed / 3.0;
          currentTime = Math.max(MIN_TIME_MS, currentTime - reduction);
        }
        
        activeTimeRef.current = currentTime;
        setActiveTimeMs(currentTime);
      } catch (e) {
        console.error("Failed to load time tracker data", e);
      }
    };
    
    initializeTracker();
  }, []);

  // Lógica principal de subscripción y conteo
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    const startInterval = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        // Sumar tiempo si está en primer plano y no supera 6h
        activeTimeRef.current = Math.min(MAX_TIME_MS, activeTimeRef.current + 1000);
        setActiveTimeMs(activeTimeRef.current);
      }, 1000);
    };

    const stopIntervalAndSaveState = async () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      try {
        await AsyncStorage.multiSet([
          [STORAGE_KEY_TIME, activeTimeRef.current.toString()],
          [STORAGE_KEY_LAST_SEEN, Date.now().toString()]
        ]);
      } catch (e) {
        console.error("Failed to save time tracker state", e);
      }
    };

    // Este listener reacciona a los cambios entre background (apagado) y active (primer plano)
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // ¡La app volvió al primer plano!
        // Calculamos cuánto tiempo estuvo offline y reducimos el contador actual
        try {
          const storedLastSeen = await AsyncStorage.getItem(STORAGE_KEY_LAST_SEEN);
          if (storedLastSeen) {
            const lastSeenMs = parseInt(storedLastSeen, 10);
            const nowMs = Date.now();
            const offlineElapsed = Math.max(0, nowMs - lastSeenMs);
            const reduction = offlineElapsed / 3.0; // Reduce 3 veces más lento
            
            activeTimeRef.current = Math.max(MIN_TIME_MS, activeTimeRef.current - reduction);
            setActiveTimeMs(activeTimeRef.current);
          }
        } catch (e) {}
        
        startInterval();
        
      } else if (nextAppState.match(/inactive|background/)) {
        // ¡La app se ha ido a segundo plano o se apagó la pantalla!
        stopIntervalAndSaveState();
      }
      
      appState.current = nextAppState;
    };

    // Si al montar el hook la app ya está activa (muy común), iniciamos a contar
    if (appState.current === 'active') {
      startInterval();
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // Limpieza cuando este hook se desmonta
      stopIntervalAndSaveState();
      subscription.remove();
      if (interval) clearInterval(interval);
    };
  }, []);
  
  // Función de ayuda para obtener el tiempo en formato fácil (HH:MM:SS)
  const getFormattedTime = () => {
    const totalSeconds = Math.floor(activeTimeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return { activeTimeMs, activeTimeHours: activeTimeMs / (3600 * 1000), formattedTime: getFormattedTime() };
}
