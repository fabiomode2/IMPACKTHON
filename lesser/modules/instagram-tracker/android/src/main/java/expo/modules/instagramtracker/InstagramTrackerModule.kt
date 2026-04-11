package expo.modules.instagramtracker

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

class InstagramTrackerModule : Module() {

  private val context: Context
    get() = appContext.reactContext ?: throw Exception("React context not available")

  override fun definition() = ModuleDefinition {
    Name("InstagramTracker")

    Function("hasUsagePermission") {
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      @Suppress("DEPRECATION")
      val mode = appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
      return@Function mode == AppOpsManager.MODE_ALLOWED
    }

    Function("requestUsagePermission") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    Function("getInstagramUsageToday") {
      var totalTime = 0.0
      try {
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        val startOfDay = calendar.timeInMillis
        val now = System.currentTimeMillis()

        val stats = usageStatsManager.queryAndAggregateUsageStats(startOfDay, now)
        val instagramStats = stats["com.instagram.android"]
        if (instagramStats != null) {
          totalTime = instagramStats.totalTimeInForeground.toDouble()
        }
      } catch (e: Exception) {}
      
      return@Function totalTime
    }
    
    // We can still keep the old function for short-interval polling if needed
    Function("isInstagramInForeground") {
      var isForeground = false
      try {
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        val beginTime = endTime - 1000L * 60 * 60 * 24 // Last 24 hours is safer for idle sessions
        
        val usageEvents = usageStatsManager.queryEvents(beginTime, endTime)
        val event = android.app.usage.UsageEvents.Event()
        var currentForegroundApp = ""
        
        while (usageEvents.hasNextEvent()) {
          usageEvents.getNextEvent(event)
          if (event.eventType == 1) { // ACTIVITY_RESUMED
            currentForegroundApp = event.packageName
          } else if (event.eventType == 2) { // ACTIVITY_PAUSED
            if (currentForegroundApp == event.packageName) {
              currentForegroundApp = ""
            }
          }
        }
        isForeground = currentForegroundApp == "com.instagram.android"
      } catch (e: Exception) {}
      
      return@Function isForeground
    }
  }
}
