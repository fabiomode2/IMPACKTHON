const { withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withAppUsage(config) {
    const packageName = config.android?.package || 'com.anonymous.lesser';

    config = withMainApplication(config, (config) => {
        let contents = config.modResults.contents;

        const importLine = `import ${packageName}.usage.AppUsagePackage`;

        if (!contents.includes(importLine)) {
            contents = contents.replace(
                /import com\.facebook\.react\.ReactApplication/,
                `${importLine}\nimport com.facebook.react.ReactApplication`
            );
        }

        if (!contents.includes('add(AppUsagePackage())')) {
            contents = contents.replace(
                /PackageList\(this\)\.packages\.apply \{/,
                `PackageList(this).packages.apply {\n          add(AppUsagePackage())`
            );
        }

        config.modResults.contents = contents;
        return config;
    });

    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const packagePath = packageName.replace(/\./g, '/');
            const usageDir = path.join(
                projectRoot,
                'android',
                'app',
                'src',
                'main',
                'java',
                packagePath,
                'usage'
            );

            fs.mkdirSync(usageDir, { recursive: true });

            const moduleKt = `package ${packageName}.usage

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
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
    override fun getName(): String = "AppUsageModule"

    private fun hasUsagePermission(): Boolean {
        val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactApplicationContext.packageName
            ) == AppOpsManager.MODE_ALLOWED
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactApplicationContext.packageName
            ) == AppOpsManager.MODE_ALLOWED
        }
    }

    private fun getDayWindow(): Pair<Long, Long> {
        val calendar = Calendar.getInstance()
        val endTime = calendar.timeInMillis
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        val startTime = calendar.timeInMillis
        return Pair(startTime, endTime)
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            promise.resolve(hasUsagePermission())
        } catch (e: Exception) {
            promise.reject("APP_USAGE_ERR", e)
        }
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("APP_USAGE_ERR", e)
        }
    }

    @ReactMethod
    fun getTotalDailyUsageMinutes(promise: Promise) {
        try {
            if (!hasUsagePermission()) {
                promise.resolve(0.0)
                return
            }

            val usageStatsManager =
                reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val (startTime, endTime) = getDayWindow()
            val aggregatedStats = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime)

            if (aggregatedStats.isNullOrEmpty()) {
                promise.resolve(0.0)
                return
            }

            val ownPackage = reactApplicationContext.packageName
            var totalMs = 0L

            for ((pkg, stat) in aggregatedStats) {
                if (pkg == ownPackage) continue
                if (pkg == "com.android.launcher") continue
                if (pkg == "com.google.android.apps.nexuslauncher") continue
                if (pkg == "com.miui.home") continue
                if (pkg == "com.sec.android.app.launcher") continue

                val foregroundMs = stat.totalTimeInForeground
                if (foregroundMs < 1000) continue
                totalMs += foregroundMs
            }

            promise.resolve(totalMs / 1000.0 / 60.0)
        } catch (e: Exception) {
            promise.reject("APP_USAGE_ERR", e)
        }
    }

    @ReactMethod
    fun getDailyUsageStats(promise: Promise) {
        try {
            if (!hasUsagePermission()) {
                promise.resolve(Arguments.createArray())
                return
            }

            val usageStatsManager =
                reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val packageManager = reactApplicationContext.packageManager
            val (startTime, endTime) = getDayWindow()
            val aggregatedStats = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime)
            val ownPackage = reactApplicationContext.packageName
            val result = Arguments.createArray()

            if (!aggregatedStats.isNullOrEmpty()) {
                val sorted = aggregatedStats.entries
                    .filter { (pkg, stat) ->
                        pkg != ownPackage &&
                        stat.totalTimeInForeground >= 1000 &&
                        pkg != "com.android.launcher" &&
                        pkg != "com.google.android.apps.nexuslauncher" &&
                        pkg != "com.miui.home" &&
                        pkg != "com.sec.android.app.launcher"
                    }
                    .sortedByDescending { it.value.totalTimeInForeground }

                for ((pkg, stat) in sorted) {
                    val appLabel = try {
                        val appInfo = packageManager.getApplicationInfo(pkg, 0)
                        packageManager.getApplicationLabel(appInfo).toString()
                    } catch (_: Exception) {
                        pkg
                    }

                    val item = Arguments.createMap()
                    item.putString("name", appLabel)
                    item.putString("packageName", pkg)
                    item.putDouble("usageTime", stat.totalTimeInForeground / 1000.0 / 60.0)
                    result.pushMap(item)
                }
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("APP_USAGE_ERR", e)
        }
    }
}
`;

            const packageKt = `package ${packageName}.usage

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

            fs.writeFileSync(path.join(usageDir, 'AppUsageModule.kt'), moduleKt);
            fs.writeFileSync(path.join(usageDir, 'AppUsagePackage.kt'), packageKt);

            return config;
        },
    ]);

    return config;
}

module.exports = withAppUsage;