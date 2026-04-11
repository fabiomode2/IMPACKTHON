package com.anonymous.lesser.vpn

import android.content.Context
import android.content.SharedPreferences

object DelayCalculator {
    private const val PREFS = "lesser_throttle"
    private const val KEY_START = "session_start_ms"

    fun startSession(ctx: Context) {
        prefs(ctx).edit().putLong(KEY_START, System.currentTimeMillis()).apply()
    }

    fun endSession(ctx: Context) {
        prefs(ctx).edit().clear().apply()
    }

    fun getCurrentDelayMs(ctx: Context): Long {
        val p = prefs(ctx)
        val start = p.getLong(KEY_START, System.currentTimeMillis())
        val mins = (System.currentTimeMillis() - start) / 60_000.0
        return when {
            mins < 5 -> 200L
            mins < 15 -> (200 + (800 - 200) * ((mins - 5) / 10.0)).toLong()
            mins < 30 -> (800 + (2000 - 800) * ((mins - 15) / 15.0)).toLong()
            else -> (2000 + (4000 - 2000) * ((mins - 30) / 30.0).coerceAtMost(1.0)).toLong()
        }.coerceIn(200, 4000)
    }

    private fun prefs(ctx: Context): SharedPreferences =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
