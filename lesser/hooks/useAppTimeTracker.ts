import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let InstagramTrackerModule: any = null;
try {
  InstagramTrackerModule = require('../modules/instagram-tracker').default;
} catch (e) {
  console.warn("InstagramTrackerModule not available. Are you on iOS or missing native rebuild?");
}

const STORAGE_KEY_TIME = '@app_active_time';
const STORAGE_KEY_LAST_SEEN = '@app_last_seen_timestamp';
const STORAGE_KEY_IG_TODAY = '@ig_usage_today';

// Definimos los límites del contador en milisegundos
const MAX_TIME_MS = 6 * 3600 * 1000; // 6 horas en milisegundos
const MIN_TIME_MS = 0;               // 0 horas

export function useAppTimeTracker() {
  const [activeTimeMs, setActiveTimeMs] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  
  // Referencias para no perder el estado actual dentro de los clousures
  const appState = useRef(AppState.currentState);
  const activeTimeRef = useRef<number>(0);
  const igUsageTodayRef = useRef<number>(0);
  const isIgForegroundRef = useRef<boolean>(false);

  // Funciones manuales para gestionar el permiso en Android
  const checkPermission = () => {
    if (Platform.OS === 'android' && InstagramTrackerModule) {
      try {
        const granted = InstagramTrackerModule.hasUsagePermission();
        setHasPermission(granted);
        return granted;
      } catch (e) {
        return false;
      }
    }
    return true; // En iOS o web asumimos true para silenciar errores
  };

  const requestPermission = () => {
    if (Platform.OS === 'android' && InstagramTrackerModule) {
      try {
        InstagramTrackerModule.requestUsagePermission();
      } catch (e) {}
    }
  };

  // Carga inicial y cálculo del tiempo cuando estuvo apagada la app
  useEffect(() => {
    const initializeTracker = async () => {
      checkPermission();
      
      try {
        const storedTime = await AsyncStorage.getItem(STORAGE_KEY_TIME);
        const storedLastSeen = await AsyncStorage.getItem(STORAGE_KEY_LAST_SEEN);
        const storedIgToday = await AsyncStorage.getItem(STORAGE_KEY_IG_TODAY);
        
        let currentTime = storedTime ? parseFloat(storedTime) : 0;
        let lastIgUsage = storedIgToday ? parseFloat(storedIgToday) : 0;
        
        // Calculo del tiempo offline / background antes de abrir la app de nuevo
        if (storedLastSeen && Platform.OS === 'android' && InstagramTrackerModule) {
          try {
            const currentIgToday = InstagramTrackerModule.getInstagramUsageToday();
            const lastSeenMs = parseInt(storedLastSeen, 10);
            const nowMs = Date.now();
            
            const offlineElapsed = Math.max(0, nowMs - lastSeenMs);
            let igUsedOffline = 0;

            if (currentIgToday >= lastIgUsage) {
                igUsedOffline = Math.max(0, currentIgToday - lastIgUsage);
            } else {
                // Pasamos a un día nuevo, el uso de hoy empezó desde 0
                igUsedOffline = currentIgToday; 
            }

            // Clampeamos el uso al tiempo real transcurrido
            igUsedOffline = Math.min(igUsedOffline, offlineElapsed);
            
            const offlineNotOnIg = Math.max(0, offlineElapsed - igUsedOffline);
            
            // Tiempo sumado por IG
            currentTime += igUsedOffline;
            // Tiempo restado por NO usar IG (3 veces más lento)
            currentTime -= (offlineNotOnIg / 3.0);
            
            currentTime = Math.max(MIN_TIME_MS, Math.min(MAX_TIME_MS, currentTime));
            
            igUsageTodayRef.current = currentIgToday;
          } catch(e) {}
        }
        
        activeTimeRef.current = currentTime;
        setActiveTimeMs(currentTime);
      } catch (e) {
        console.error("Failed to load time tracker data", e);
      }
    };
    
    initializeTracker();
  }, []);

  // Listener para AppState con el fin de guardar al salir de la app
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkPermission();
        if (Platform.OS === 'android' && InstagramTrackerModule) {
          try { InstagramTrackerModule.stopVigilante(); } catch(e) {}
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // Nos vamos al background o el user sale de la app: salvamos estado
        if (Platform.OS === 'android' && InstagramTrackerModule) {
          try { InstagramTrackerModule.startVigilante(); } catch(e) {}
        }
        try {
          let currentIgToday = igUsageTodayRef.current;
          if (Platform.OS === 'android' && InstagramTrackerModule) {
            try {
               currentIgToday = InstagramTrackerModule.getInstagramUsageToday();
               igUsageTodayRef.current = currentIgToday;
            } catch(e) {}
          }
             
          await AsyncStorage.multiSet([
            [STORAGE_KEY_TIME, activeTimeRef.current.toString()],
            [STORAGE_KEY_LAST_SEEN, Date.now().toString()],
            [STORAGE_KEY_IG_TODAY, currentIgToday.toString()]
          ]);
        } catch (e) {}
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  // Intervalo continuo (Polling principal en primer plano)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let lastTick = Date.now();

    const tick = async () => {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;

      if (delta > 60000) {
        // Si el delta es enorme, significa que la app ha despertado sin montar de nuevo el componente
        // Hacemos un calculo agrupado como en la inicializacion
        if (Platform.OS === 'android' && InstagramTrackerModule) {
            try {
                const currentIgToday = InstagramTrackerModule.getInstagramUsageToday();
                let igUsedOffline = 0;
                if (currentIgToday >= igUsageTodayRef.current) {
                   igUsedOffline = currentIgToday - igUsageTodayRef.current;
                } else {
                   igUsedOffline = currentIgToday;
                }
                igUsedOffline = Math.min(igUsedOffline, delta);
                const offlineNotOnIg = Math.max(0, delta - igUsedOffline);
                
                let tempTime = activeTimeRef.current + igUsedOffline - (offlineNotOnIg / 3.0);
                activeTimeRef.current = Math.max(MIN_TIME_MS, Math.min(MAX_TIME_MS, tempTime));
                igUsageTodayRef.current = currentIgToday;
            } catch(e) {}
        }
      } else {
         // Tick sub-minuto: checkeamos si IG esta en primer plano
         if (Platform.OS === 'android' && InstagramTrackerModule) {
           try {
             isIgForegroundRef.current = InstagramTrackerModule.isInstagramInForeground();
           } catch(e) {}
         }
         
         if (isIgForegroundRef.current) {
            // Sube el tiempo si estamos en IG
            activeTimeRef.current += delta;
         } else {
            // Baja 3 veces mas lento si no
            activeTimeRef.current -= (delta / 3.0);
         }
         activeTimeRef.current = Math.max(MIN_TIME_MS, Math.min(MAX_TIME_MS, activeTimeRef.current));
      }

      setActiveTimeMs(Math.floor(activeTimeRef.current));
    };

    // Actualizamos el contador cada 1000 milisegundos
    interval = setInterval(tick, 1000);

    return () => {
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

  return { activeTimeMs, activeTimeHours: activeTimeMs / (3600 * 1000), formattedTime: getFormattedTime(), hasPermission, requestPermission, checkPermission };
}
