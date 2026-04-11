package com.anonymous.lesser.vpn

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.os.Build
import com.facebook.react.bridge.*

class ThrottleVpnModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx), ActivityEventListener {
    companion object { const val NAME = "ThrottleVpn"; const val REQ_VPN = 0xCAFE }
    private var pendingPromise: Promise? = null
    private var pendingPackages: ArrayList<String>? = null
    init { ctx.addActivityEventListener(this) }
    override fun getName() = NAME

    @ReactMethod
    fun startVpn(packages: ReadableArray, promise: Promise) {
        val act = currentActivity ?: return promise.reject("NO_ACTIVITY", "No activity")
        val list = ArrayList<String>().apply { for (i in 0 until packages.size()) add(packages.getString(i)) }
        val prepareIntent = VpnService.prepare(act)
        if (prepareIntent == null) { launchService(list); promise.resolve("started") }
        else { pendingPromise = promise; pendingPackages = list; act.startActivityForResult(prepareIntent, REQ_VPN) }
    }

    @ReactMethod
    fun stopVpn(promise: Promise) {
        ctx.startService(Intent(ctx, SlowVpnService::class.java).apply { action = SlowVpnService.ACTION_STOP })
        promise.resolve("stopped")
    }

    @ReactMethod
    fun getCurrentDelay(promise: Promise) { promise.resolve(DelayCalculator.getCurrentDelayMs(ctx).toDouble()) }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != REQ_VPN) return
        val p = pendingPromise ?: return; val pkgs = pendingPackages ?: return
        pendingPromise = null; pendingPackages = null
        if (resultCode == Activity.RESULT_OK) { launchService(pkgs); p.resolve("started") }
        else { p.reject("PERMISSION_DENIED", "Denied") }
    }
    override fun onNewIntent(intent: Intent?) {}

    private fun launchService(pkgs: ArrayList<String>) {
        val intent = Intent(ctx, SlowVpnService::class.java).apply { action = SlowVpnService.ACTION_START; putStringArrayListExtra(SlowVpnService.EXTRA_PACKAGES, pkgs) }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(intent) else ctx.startService(intent)
    }
}
