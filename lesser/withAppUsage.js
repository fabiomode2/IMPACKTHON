const { withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAppUsage = (config) => {
  // Add the package to MainApplication.kt
  config = withMainApplication(config, async (config) => {
    let mainApp = config.modResults.contents;
    
    // Add import
    const importStr = 'import com.fabiomode2.lesser.usage.AppUsagePackage\n';
    if (!mainApp.includes('AppUsagePackage')) {
      mainApp = mainApp.replace(/import com\.facebook\.react\.ReactApplication/, importStr + 'import com.facebook.react.ReactApplication');
    }

    // Add package to getPackages()
    const packageStr = 'add(AppUsagePackage())\n              ';
    if (!mainApp.includes('AppUsagePackage()')) {
      mainApp = mainApp.replace(/(override fun getPackages\(\): List<ReactPackage> =\s*PackageList\(this\)\.packages\.apply \{)/m, `$1\n              ${packageStr}`);
    }

    config.modResults.contents = mainApp;
    return config;
  });

  // Inject the actual Kotlin files
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageName = config.android.package || 'com.fabiomode2.lesser';
      const packagePath = packageName.replace(/\./g, '/');
      
      const usageDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', packagePath, 'usage');
      fs.mkdirSync(usageDir, { recursive: true });

      const moduleContent = `package ${packageName}.usage

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import android.os.Process
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Calendar

class AppUsageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String { return "AppUsageModule" }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), reactApplicationContext.packageName)
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), reactApplicationContext.packageName)
            }
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("APP_USAGE_ERR", e)
        }
    }

    @ReactMethod
    fun getTotalDailyUsageMinutes(promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val calendar = Calendar.getInstance()
            val endTime = calendar.timeInMillis
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startTime = calendar.timeInMillis

            val aggregatedStats = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime)
            if (aggregatedStats.isNullOrEmpty()) {
                promise.resolve(0.0)
                return
            }

            val ownPackage = reactApplicationContext.packageName
            var totalMs = 0L

            for ((pkg, stat) in aggregatedStats) {
                if (pkg == ownPackage) continue
                if (pkg == "com.android.launcher" || pkg == "com.google.android.apps.nexuslauncher" || pkg == "com.miui.home" || pkg == "com.sec.android.app.launcher") continue

                val fg = stat.totalTimeInForeground
                if (fg < 1_000) continue
                totalMs += fg
            }

            promise.resolve(totalMs / 1000.0 / 60.0)
        } catch (e: Exception) {
            promise.reject("APP_USAGE_ERR", e)
        }
    }
}
`;

      const packageContent = `package ${packageName}.usage

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class AppUsagePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(AppUsageModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

      fs.writeFileSync(path.join(usageDir, 'AppUsageModule.kt'), moduleContent);
      fs.writeFileSync(path.join(usageDir, 'AppUsagePackage.kt'), packageContent);
      
      return config;
    },
  ]);

  return config;
};

module.exports = withAppUsage;
