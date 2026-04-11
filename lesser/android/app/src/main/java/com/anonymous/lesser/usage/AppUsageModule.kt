package com.anonymous.lesser.usage

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Calendar

class AppUsageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AppUsageModule"
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    reactApplicationContext.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    reactApplicationContext.packageName
                )
            }
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("APP_USAGE_ERR", e)
        }
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("APP_USAGE_ERR", "Cannot open settings", e)
        }
    }

    @ReactMethod
    fun getDailyUsageStats(promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

            // Usar inicio del día de hoy (medianoche) hasta ahora — esto es lo que INTERVAL_DAILY entiende
            val calendar = Calendar.getInstance()
            val endTime = calendar.timeInMillis
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startTime = calendar.timeInMillis

            // Usar INTERVAL_BEST para mayor resolución y asegurarse de no recibir vacío
            val stats: List<UsageStats>? = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_BEST, startTime, endTime
            )

            if (stats.isNullOrEmpty()) {
                promise.resolve(Arguments.createArray())
                return
            }

            val pm = reactApplicationContext.packageManager
            val results = Arguments.createArray()

            // Acumulamos por paquete (puede haber duplicados por rango de intervalos)
            val packageUsageMap = mutableMapOf<String, Long>()
            for (usageStat in stats) {
                val foreground = usageStat.totalTimeInForeground
                if (foreground > 0) {
                    val pkg = usageStat.packageName
                    packageUsageMap[pkg] = (packageUsageMap[pkg] ?: 0L) + foreground
                }
            }

            val ownPackage = reactApplicationContext.packageName

            for ((pkgName, totalTime) in packageUsageMap) {
                // Saltamos la propia app y launchers conocidos
                if (pkgName == ownPackage) continue
                if (pkgName == "com.android.launcher" ||
                    pkgName == "com.google.android.apps.nexuslauncher" ||
                    pkgName == "com.miui.home" ||
                    pkgName == "com.sec.android.app.launcher") continue

                // Filtrar tiempos de uso muy pequeños (< 5 segundos de ruido)
                if (totalTime < 5_000) continue

                try {
                    val appInfo = pm.getApplicationInfo(pkgName, 0)
                    val label = pm.getApplicationLabel(appInfo).toString()

                    val map = Arguments.createMap()
                    map.putString("packageName", pkgName)
                    map.putString("name", label)
                    // Devolver en MINUTOS como antes
                    map.putDouble("usageTime", totalTime / 1000.0 / 60.0)
                    results.pushMap(map)
                } catch (e: PackageManager.NameNotFoundException) {
                    // Paquete desinstalado — ignorar
                }
            }

            promise.resolve(results)

        } catch (e: Exception) {
            promise.reject("APP_USAGE_ERR", e)
        }
    }

    /**
     * Returns the TOTAL device screen usage in minutes today (midnight to now).
     * This is a single aggregated value — simpler and faster than getDailyUsageStats.
     */
    @ReactMethod
    fun getTotalDailyUsageMinutes(promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

            val calendar = Calendar.getInstance()
            val endTime = calendar.timeInMillis
            // Start of today at midnight
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startTime = calendar.timeInMillis

            // queryAndAggregateUsageStats is vastly superior to queryUsageStats as it
            // merges all states automatically and avoids double-counting overlapping buckets.
            val aggregatedStats = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime)

            if (aggregatedStats.isNullOrEmpty()) {
                promise.resolve(0.0)
                return
            }

            val ownPackage = reactApplicationContext.packageName
            var totalMs = 0L

            for ((pkg, stat) in aggregatedStats) {
                if (pkg == ownPackage) continue // Exclude this app
                
                // Exclude system launchers which run indefinitely
                if (pkg == "com.android.launcher" || 
                    pkg == "com.google.android.apps.nexuslauncher" || 
                    pkg == "com.miui.home" || 
                    pkg == "com.sec.android.app.launcher") continue

                val fg = stat.totalTimeInForeground
                if (fg < 1_000) continue // Ignore sub-second noise
                
                totalMs += fg
            }

            promise.resolve(totalMs / 1000.0 / 60.0) // Return as minutes

        } catch (e: Exception) {
            promise.reject("APP_USAGE_ERR", e)
        }
    }
}
