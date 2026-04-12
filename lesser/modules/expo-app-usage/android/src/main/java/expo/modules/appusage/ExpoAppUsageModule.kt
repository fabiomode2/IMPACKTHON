package expo.modules.appusage

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

class ExpoAppUsageModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoAppUsage")

    Function("hasPermission") {
      val context = appContext.reactContext ?: return@Function false
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      
      val mode = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
          appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      } else {
          @Suppress("DEPRECATION")
          appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      }
      
      return@Function if (mode == AppOpsManager.MODE_DEFAULT) {
        context.checkCallingOrSelfPermission(android.Manifest.permission.PACKAGE_USAGE_STATS) == PackageManager.PERMISSION_GRANTED
      } else {
        mode == AppOpsManager.MODE_ALLOWED
      }
    }

  Function("requestPermission") {
    appContext.reactContext?.let { context ->
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }
  }

    Function("getDailyUsageStats") {
      val context = appContext.reactContext ?: return@Function emptyMap<String, Any>()
      val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      
      val calendar = Calendar.getInstance()
      val endTime = calendar.timeInMillis
      calendar.set(Calendar.HOUR_OF_DAY, 0)
      calendar.set(Calendar.MINUTE, 0)
      calendar.set(Calendar.SECOND, 0)
      val startTime = calendar.timeInMillis

      val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
      
      var totalForegroundTime = 0L
      val appUsageList = mutableListOf<Map<String, Any>>()
      val packageManager = context.packageManager
      
      for (usageStats in stats) {
        if (usageStats.totalTimeInForeground > 0) {
          totalForegroundTime += usageStats.totalTimeInForeground
          try {
             val appInfo = packageManager.getApplicationInfo(usageStats.packageName, 0)
             val isSystemApp = (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
             if (!isSystemApp && usageStats.packageName != context.packageName) {
               val appName = packageManager.getApplicationLabel(appInfo).toString()
               appUsageList.add(mapOf(
                 "packageName" to usageStats.packageName,
                 "name" to appName,
                 "usageTime" to (usageStats.totalTimeInForeground / 1000 / 60).toLong(),
                 "icon" to "grid" // Placeholder icon name
               ))
             }
          } catch (e: Exception) {
             // Ignore
          }
        }
      }
      
      appUsageList.sortByDescending { it["usageTime"] as Long }
      
      return@Function mapOf(
        "totalHours" to totalForegroundTime.toDouble() / (1000.0 * 60.0 * 60.0),
        "apps" to appUsageList.take(5)
      )
    }
  }
}
