package com.fabiomode2.lesser;

import android.content.Intent;      // <--- Faltaba
import android.os.Build;            // <--- Faltaba

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.Map;
import java.util.HashMap;

import android.util.Log;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import com.facebook.react.bridge.Promise;

import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;


public class BackgroundFabModule extends ReactContextBaseJavaModule {
   private static int modoActual = 1; // 1: Low, 2: Mid, 3: Strong

   public static int getModo() {
    return modoActual;
    }

   BackgroundFabModule(ReactApplicationContext context) {
       super(context);
   }

    @ReactMethod
        public void setModoFuncionamiento(int modo) {
            BackgroundFabModule.modoActual = modo;
            Log.d("MODULO_NATIVO", "Modo cambiado a: " + modo);
        }

    @ReactMethod
    public void createBackgroundApp(String name) {
        Log.d("BackgroundFabModule", "Create event called with name: " + name);
    }

    @ReactMethod
    public void startService() {
        ReactApplicationContext context = getReactApplicationContext();
        Intent serviceIntent = new Intent(context, MainService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

    @ReactMethod
    public void getForegroundApp(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            UsageStatsManager usm = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
            long time = System.currentTimeMillis();
            // Consultar la última hora
            List<UsageStats> appList = usm.queryUsageStats(UsageStatsManager.INTERVAL_BEST, time - 1000 * 3600, time);
            
            if (appList != null && !appList.isEmpty()) {
                SortedMap<Long, UsageStats> mySortedMap = new TreeMap<>();
                for (UsageStats usageStats : appList) {
                    mySortedMap.put(usageStats.getLastTimeUsed(), usageStats);
                }
                if (!mySortedMap.isEmpty()) {
                    String currentApp = mySortedMap.get(mySortedMap.lastKey()).getPackageName();
                    promise.resolve(currentApp);
                    return;
                }
            }
            promise.resolve("No se encontró ninguna app (revisa los permisos)");
        } catch (Exception e) {
            promise.reject("ERROR_GET_APP", e.getMessage());
        }
    }

    @Override
    public String getName() {
    return "BackgroundFabModule";
    }
}





