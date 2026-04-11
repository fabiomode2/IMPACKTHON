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

import android.app.usage.UsageStats;          // <--- Faltaba
import android.app.usage.UsageStatsManager;   // <--- Faltaba
import android.content.Context;               // <--- Faltaba

import java.util.List;                        // <--- Faltaba
import java.util.SortedMap;                   // <--- Faltaba
import java.util.TreeMap;                     // <--- Faltaba


public class MainService extends Service {
    private static final String CHANNEL_ID = "ForegroundServiceChannel";
    private Handler handler;
    private Runnable runnable;
    private int intervalo_actualizacion_app = 60000;
    private String app_activa = "";


    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createNotificationChannel();
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Servicio Activo")
                .setContentText("Lesser está monitoreando en segundo plano")
                // .setSmallIcon(R.mipmap.ic_launcher) // Necesitarás un icono real aquí
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(1, notification);
        }

        Log.d("MODULO_NATIVO", "Servicio iniciado. Registrando tarea repetitiva...");

        runnable = new Runnable() {
            @Override
            public void run() {
                checkForegroundApp();
                // Volver a ejecutar dentro de 30 segundos (30000 milisegundos)
                handler.postDelayed(this, intervalo_actualizacion_app);
            }
        };

        // Iniciar la primera vez inmediatamente
        handler.post(runnable);
        
        return START_STICKY;
    }

    private void checkForegroundApp() {
        UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        long time = System.currentTimeMillis();
        List<UsageStats> appList = usm.queryUsageStats(UsageStatsManager.INTERVAL_BEST,  time - 1000 * 3600, time);
        
        if (appList != null && appList.size() > 0) {
            SortedMap<Long, UsageStats> mySortedMap = new TreeMap<Long, UsageStats>();
            for (UsageStats usageStats : appList) {
                mySortedMap.put(usageStats.getLastTimeUsed(), usageStats);
            }
            if (!mySortedMap.isEmpty()) {
                String currentApp = mySortedMap.get(mySortedMap.lastKey()).getPackageName();
                Log.d("MODULO_NATIVO", "¡Hola desde Java! App en primer plano (actualizada): " + currentApp );
                app_activa = currentApp;
            }
        } else {
            Log.d("MODULO_NATIVO", "La lista de UsageStats está vacía o es null. Revisa el permiso PACKAGE_USAGE_STATS o el intervalo de tiempo.");
        }
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

    @Override
    public IBinder onBind(Intent intent) { return null; }

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