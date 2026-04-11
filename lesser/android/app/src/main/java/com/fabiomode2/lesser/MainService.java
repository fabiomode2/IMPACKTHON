package com.fabiomode2.lesser;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import android.graphics.Color;

// monocromo
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.Paint;

import android.app.usage.UsageStats;          // <--- Faltaba
import android.app.usage.UsageStatsManager;   // <--- Faltaba
import android.content.Context;               // <--- Faltaba

import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.prefs.BackingStoreException;
import java.util.Map;
import java.util.HashMap;
import android.view.WindowManager;
import android.view.View;
import android.graphics.PixelFormat;
import android.media.AudioManager;
import android.provider.Settings;


public class MainService extends Service {
    private static class AppStats {
        double minutosAcumulados = 0;
        long ultimoAcceso;

        AppStats(long timestamp) {
            this.ultimoAcceso = timestamp;
        }
    }
    
    private static final String CHANNEL_ID = "ForegroundServiceChannel";
    //private static final int intervalo_actualizacion_app = 60000;
    private static final int intervalo_actualizacion_app = 5000;
    private static final int ratio_restar_minutos = 5;

    // a partir de que tiempo puede tocar esto
    // private static final int umbral_muteo_audio = 10;
    // private static final int umbral_parpadeo = 20;
    // private static final int umbral_selfie = 30;

    // las probs estas se checkean cada 1 minuto
    // private static final float prob_muteo_audio = 0.3 / 30.;
    // private static final float prob_parpadeo = 0.2 / 30.;
    // private static final float prob_selfie = 0.1 / 30.;

    // a partir de que tiempo puede tocar esto
    private static final int umbral_muteo_audio = 1;
    private static final int umbral_parpadeo = 2;
    private static final int umbral_monocromo = 2;
    private static final int umbral_selfie = 3;

    // las probs estas se checkean cada 1 minuto
    private static final float prob_muteo_audio = 1.0f;

    private static final float prob_parpadeo = 1.0f;
    private static final float prob_selfie = 1.0f;
    private static final int tiempo_muteo_audio = 15 * 1000;


    private static final int tiempo_parpadeo = 5 * 1000;
    private static final int tiempo_selfie = 5 * 1000;
    private static final float max_min_monocromo = 30.0f;

    private int flickerCount = 0; // Para el nuevo parpadeo

    private WindowManager windowManager;
    private View monochromeOverlay;
    private View overlayView;
    private Handler handler;
    private Runnable runnable;
    private AudioManager audioManager;
    private Map<String, AppStats> usageMap = new HashMap<>();
    private String lastAppChecked = "";
    private int originalVolume = -1; // Para restaurar el audio
    private boolean isMuting = false; // <--- Nuevo flag
    private long lastFlickerTime = 0;
    private long lastCameraTime = 0;
    private String app_activa = "";

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
    }

    // AUDIO
    public void mute_audio_temporal(int duracionMs) {
        if (isMuting) {
            Log.d("MODULO_NATIVO", "Mute omitido (ya está en curso)");
            return;
        }
        
        if (audioManager == null) audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);

        // Guardamos el volumen actual
        originalVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
        if (originalVolume == 0) {
            Log.d("MODULO_NATIVO", "Mute omitido (el volumen ya era 0)");
            return;
        }

        isMuting = true;
        // Muteamos
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, 0, 0);
        Log.d("MODULO_NATIVO", "Audio Muteado (Original: " + originalVolume + ")");

        // Programamos la restauración
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (originalVolume != -1) {
                    audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, originalVolume, 0);
                    Log.d("MODULO_NATIVO", "Audio Restaurado a " + originalVolume);
                }
                isMuting = false;
            }
        }, duracionMs);
    }

    // CAMARA

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // crear notificion para poder estar en segundo plano INFINITAMENTE
        createNotificationChannel();
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Servicio Activo")
                .setContentText("Lesser está monitoreando en segundo plano")
                // .setSmallIcon(R.mipmap.ic_launcher)
                .build();

        // if random
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(1, notification);
        }

        if (!Settings.canDrawOverlays(this)) {
            Intent intenttttttt = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            intenttttttt.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intenttttttt);
        }

        Log.d("MODULO_NATIVO", "Servicio ESPIONAJE iniciado jejejejej");

        // ejecutar checkeo cada 60s
        runnable = new Runnable() {
            @Override
            public void run() {
                checkForegroundApp();
                handler.postDelayed(this, intervalo_actualizacion_app);
            }
        };

        // iniciar la primera vez inmediatamente
        handler.post(runnable);
        
        return START_STICKY;
    }

        @Override
    public void onDestroy() {
        super.onDestroy();
        if (handler != null && runnable != null) {
            handler.removeCallbacks(runnable);
        }
    }

    public String fabGetActiveApp(){
        return app_activa;
    }



    // WIFI
    // FALTA WIFI WIFI WIFI WIFI

    @Override
    public IBinder onBind(Intent intent) { return null; }

    // MONOCROMO
    private void setMonochromeSimple(float intensity) {
        intensity = Math.max(0.0f, Math.min(0.8f, intensity)); // Capado al 80% para no dejar negro total
        
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        
        if (intensity <= 0.01f) {
            if (monochromeOverlay != null) {
                windowManager.removeView(monochromeOverlay);
                monochromeOverlay = null;
            }
            return;
        }

        int alpha = (int) (intensity * 255);
        // Usamos negro con alpha para que parezca que la pantalla se apaga
        int colorOverlay = Color.argb(alpha, 0, 0, 0); 

        if (monochromeOverlay == null) {
            monochromeOverlay = new View(this);
            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT,
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ? 
                        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : 
                        WindowManager.LayoutParams.TYPE_PHONE,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                    PixelFormat.TRANSLUCENT);
            
            monochromeOverlay.setBackgroundColor(colorOverlay);
            windowManager.addView(monochromeOverlay, params);
            Log.d("MODULO_NATIVO", "Capa monocromo añadida con intensidad: " + intensity);
        } else {
            monochromeOverlay.setBackgroundColor(colorOverlay);
        }
    }


    // PARPADEO
    private void toggleFlicker(int duracionMs) {
        if (overlayView != null) return; // Evitar solapamientos

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        overlayView = new View(this);
        overlayView.setBackgroundColor(Color.BLACK); 

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ? 
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : 
                    WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                PixelFormat.TRANSLUCENT);

        try {
            windowManager.addView(overlayView, params);
            Log.d("MODULO_NATIVO", "Iniciando parpadeo...");
            // Iniciamos el ciclo de parpadeo recursivo
            runFlickerCycle(10); // 10 parpadeos
        } catch (Exception e) {
            Log.e("MODULO_NATIVO", "Error parpadeo: " + e.getMessage());
        }
    }

    private void runFlickerCycle(int remaining) {
        if (remaining <= 0 || overlayView == null) {
            if (overlayView != null) {
                windowManager.removeView(overlayView);
                overlayView = null;
            }
            return;
        }

        // Alternar visibilidad cada 100ms para que sea un parpadeo agresivo
        overlayView.setVisibility(overlayView.getVisibility() == View.VISIBLE ? View.INVISIBLE : View.VISIBLE);
        
        handler.postDelayed(() -> runFlickerCycle(remaining - 1), 150); 
    }

    private void checkForegroundApp() {
        UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        long now = System.currentTimeMillis();
        List<UsageStats> appList = usm.queryUsageStats(UsageStatsManager.INTERVAL_BEST,  now - 1000 * 3600, now);
        
        if (appList != null && !appList.isEmpty()) {
            SortedMap<Long, UsageStats> mySortedMap = new TreeMap<>();
            for (UsageStats usageStats : appList) {
                mySortedMap.put(usageStats.getLastTimeUsed(), usageStats);
            }
            
            String currentApp = mySortedMap.get(mySortedMap.lastKey()).getPackageName();
            app_activa = currentApp;

            actualizarEstadisticasApp(currentApp, now);
            }
    }

    private void actualizarEstadisticasApp(String packageName, long now) {
    // 1. Si no existe en el mapa, la creamos
        if (!usageMap.containsKey(packageName)) {
            usageMap.put(packageName, new AppStats(now));
        }

        AppStats stats = usageMap.get(packageName);
        long tiempoDesdeUltimoAcceso = now - stats.ultimoAcceso;

        // 2. Lógica de "Enfriamiento"
        long minutosAFuera = tiempoDesdeUltimoAcceso / (60 * 1000); // calcular minutos reales
        stats.minutosAcumulados = Math.max(0, stats.minutosAcumulados - (int)(minutosAFuera / ratio_restar_minutos));        

        // 3. Sumar tiempo real (si el handler corre cada 5s, sumamos 5/60 de minuto)
        //double incremento = (double)intervalo_actualizacion_app / 60000.0;
        stats.minutosAcumulados += 1;
        stats.ultimoAcceso = now;

        Log.d("MODULO_NATIVO", "App: " + packageName);

        // 4. DISPARAR EVENTOS SEGÚN UMBRALES
        verificarUmbrales(packageName, stats.minutosAcumulados);
    }

    private void verificarUmbrales(String packageName, double minutos) {
        // Evitamos castigar a nuestra propia app o al launcher
        if (packageName.equals("com.fabiomode2.lesser") || packageName.contains("launcher")) return;

        int modo = BackgroundFabModule.getModo(); // Obtenemos el modo que TSX nos dijo

        // MODO 1 (LOW): Solo audio
        if (modo >= 1) {
            if (minutos >= umbral_muteo_audio && Math.random() < prob_muteo_audio) {
                mute_audio_temporal(tiempo_muteo_audio);
            }
        }

        // MODO 2 (MID): Añadimos parpadeo y monocromo
        if (modo >= 2) {
            long now = System.currentTimeMillis();
            if (minutos >= umbral_parpadeo && Math.random() < prob_parpadeo) {
                if (now - lastFlickerTime > tiempo_parpadeo + 5000) {
                    lastFlickerTime = now;
                    toggleFlicker(tiempo_parpadeo);
                } else {
                    Log.d("MODULO_NATIVO", "Parpadeo omitido (en cooldown)");
                }
            }
            setMonochromeSimple((float)minutos / max_min_monocromo);
        }

        // MODO 3 (STRONG): El selfie delator
        if (modo == 3) {
            long now = System.currentTimeMillis();
            if (minutos >= umbral_selfie && Math.random() < prob_selfie) {
                if (now - lastCameraTime > 30000) { // Cooldown de 30s para no spammer apps
                    lastCameraTime = now;
                    try {
                        Log.d("MODULO_NATIVO", "Lanzando cámara fantasma...");
                        Intent intent = new Intent(this, CameraActivity.class);
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_MULTIPLE_TASK);
                        startActivity(intent);
                    } catch (Exception e) {
                        Log.e("MODULO_NATIVO", "Error al lanzar cámara: " + e.getMessage());
                    }
                } else {
                    Log.d("MODULO_NATIVO", "Selfie omitido (en cooldown)");
                }
            }
        }

    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID, "Foreground Service Channel",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }
    }
}