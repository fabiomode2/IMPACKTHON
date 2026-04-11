package com.anonymous.lesser.vpn

import android.app.*
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket

class SlowVpnService : VpnService() {
    companion object {
        const val ACTION_START = "com.lesser.vpn.START"
        const val ACTION_STOP = "com.lesser.vpn.STOP"
        const val EXTRA_PACKAGES = "packages"
        private const val NOTIF_ID = 0xBEEF
        private const val CHANNEL = "lesser_vpn"
        val DEFAULT_BLACKLIST = listOf("com.instagram.android", "com.zhiliaoapp.musically", "com.twitter.android", "com.facebook.katana")
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var tcpManager: TcpConnectionManager

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        tcpManager = TcpConnectionManager(this, scope)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) { stopSelf(); return START_NOT_STICKY }
        val packages = intent?.getStringArrayListExtra(EXTRA_PACKAGES) ?: DEFAULT_BLACKLIST
        startForeground(NOTIF_ID, buildNotification(packages.size))
        DelayCalculator.startSession(this)
        setupVpn(packages)
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        tcpManager.closeAll()
        vpnInterface?.close()
        DelayCalculator.endSession(this)
    }

    private fun setupVpn(blacklist: List<String>) {
        val builder = Builder().setSession("Lesser Throttle").addAddress("10.99.0.1", 32).addRoute("0.0.0.0", 0).addDnsServer("8.8.8.8").setMtu(1500)
        var added = false
        blacklist.forEach { pkg -> try { builder.addAllowedApplication(pkg); added = true } catch (_: Exception) {} }
        if (!added) { stopSelf(); return }
        vpnInterface = builder.establish() ?: run { stopSelf(); return }
        startPacketLoop(vpnInterface!!)
    }

    private fun startPacketLoop(fd: ParcelFileDescriptor) {
        scope.launch(Dispatchers.IO) {
            val input = FileInputStream(fd.fileDescriptor)
            val output = FileOutputStream(fd.fileDescriptor)
            val buf = ByteArray(32767)
            while (isActive) {
                val len = runCatching { input.read(buf) }.getOrDefault(-1)
                if (len <= 0) { delay(5); continue }
                val pkt = buf.copyOf(len)
                if (IpPacketUtils.ipVersion(pkt) != 4) continue
                val delayMs = DelayCalculator.getCurrentDelayMs(this@SlowVpnService)
                when (IpPacketUtils.ipProtocol(pkt)) {
                    IpPacketUtils.PROTO_UDP -> handleUdp(pkt, delayMs, output)
                    IpPacketUtils.PROTO_TCP -> tcpManager.handlePacket(pkt, delayMs, output)
                }
            }
        }
    }

    private fun handleUdp(pkt: ByteArray, delayMs: Long, tunOut: FileOutputStream) {
        scope.launch(Dispatchers.IO) {
            val ipHL = IpPacketUtils.ipHeaderLen(pkt)
            val srcIp = IpPacketUtils.ipSrcBytes(pkt); val dstIp = IpPacketUtils.ipDstBytes(pkt)
            val srcPort = IpPacketUtils.udpSrcPort(pkt, ipHL); val dstPort = IpPacketUtils.udpDstPort(pkt, ipHL)
            val payload = pkt.copyOfRange(ipHL + 8, IpPacketUtils.ipTotalLen(pkt))
            delay(delayMs)
            try {
                val socket = DatagramSocket(); protect(socket); socket.soTimeout = 5000
                socket.send(DatagramPacket(payload, payload.size, IpPacketUtils.byteArrayToInetAddress(dstIp), dstPort))
                val respBuf = ByteArray(8192); val respPkt = DatagramPacket(respBuf, respBuf.size)
                socket.receive(respPkt); socket.close()
                delay(delayMs)
                tunOut.write(IpPacketUtils.buildUdpPacket(dstIp, srcIp, dstPort, srcPort, respBuf.copyOf(respPkt.length)))
            } catch (_: Exception) {}
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(CHANNEL, "VPN Throttle", NotificationManager.IMPORTANCE_LOW)
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(ch)
        }
    }

    private fun buildNotification(count: Int): Notification {
        val stopIntent = PendingIntent.getService(this, 0, Intent(this, SlowVpnService::class.java).apply { action = ACTION_STOP }, PendingIntent.FLAG_IMMUTABLE)
        return NotificationCompat.Builder(this, CHANNEL).setContentTitle("Lesser — Modo Lento").setContentText("Ralentizando $count apps").setSmallIcon(android.R.drawable.ic_menu_manage).setOngoing(true).addAction(android.R.drawable.ic_menu_close_clear_cancel, "Detener", stopIntent).build()
    }
}
