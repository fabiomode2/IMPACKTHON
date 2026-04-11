package expo.modules.instagramtracker

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

class InstagramTrackerModule : Module() {

  private val context: Context
    get() = appContext.reactContext ?: throw Exception("React context not available")

  private var vigilanteThread: Thread? = null

  // @Volatile ensures writes from one thread are immediately visible to other threads
  // (fixes the race condition where the background thread could read a stale value)
  @Volatile private var isVigilanteRunning = false

  private fun startVigilante() {
    // Guard: if already running, do nothing
    if (isVigilanteRunning) return
    isVigilanteRunning = true

    vigilanteThread = Thread {
      var consecutiveSeconds = 0
      while (isVigilanteRunning) {
        try {
          Thread.sleep(1000)

          // Check flag again after sleep (stopVigilante may have been called while sleeping)
          if (!isVigilanteRunning) break

          val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
          val endTime = System.currentTimeMillis()
          val beginTime = endTime - 1000L * 60 * 60 * 24

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

          if (currentForegroundApp == "com.instagram.android") {
            consecutiveSeconds++
            if (consecutiveSeconds >= 30) {
              consecutiveSeconds = 0
              isVigilanteRunning = false

              // 1. Emit the JS event FIRST so React is ready before the app comes to foreground
              this@InstagramTrackerModule.sendEvent("onPunishmentTriggered", mapOf("success" to true))

              // 2. Delay forcing the app to foreground slightly so the JS bridge can process
              //    the event and set up the camera before the Activity resumes
              Handler(Looper.getMainLooper()).postDelayed({
                val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
                if (launchIntent != null) {
                  launchIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                  )
                  context.startActivity(launchIntent)
                }
              }, 300)

              // Clean up thread reference so startVigilante can work again next cycle
              vigilanteThread = null
              break
            }
          } else {
            // User left Instagram — reset counter
            consecutiveSeconds = 0
          }
        } catch (e: InterruptedException) {
          // Interrupted by stopVigilante — exit cleanly
          break
        } catch (e: Exception) {
          // Swallow other exceptions to keep the thread alive
        }
      }
    }.also { it.isDaemon = true } // Daemon: won't prevent JVM shutdown

    vigilanteThread?.start()
  }

  private fun stopVigilante() {
    isVigilanteRunning = false
    vigilanteThread?.interrupt()
    vigilanteThread = null
  }

  override fun definition() = ModuleDefinition {
    Name("InstagramTracker")

    Events("onPunishmentTriggered")

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

    Function("isInstagramInForeground") {
      var isForeground = false
      try {
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        val beginTime = endTime - 1000L * 60 * 60 * 24

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

    Function("startVigilante") {
      startVigilante()
    }

    Function("stopVigilante") {
      stopVigilante()
    }
  }
}
