package com.anonymous.lesser.vpn

import android.net.VpnService
import kotlinx.coroutines.*
import java.net.InetSocketAddress
import java.nio.ByteBuffer
import java.nio.channels.SocketChannel
import java.util.concurrent.ConcurrentHashMap

class TcpConnectionManager(
    private val vpn: VpnService,
    private val scope: CoroutineScope
) {
    private data class TcpSession(
        val socket: SocketChannel,
        val srcIp: ByteArray, val dstIp: ByteArray,
        val srcPort: Int, val dstPort: Int,
        var localSeq: Long, var localAck: Long,
        val tunOut: java.io.FileOutputStream
    )

    private val sessions = ConcurrentHashMap<String, TcpSession>()

    fun handlePacket(pkt: ByteArray, delayMs: Long, tunOut: java.io.FileOutputStream) {
        val ipHL = IpPacketUtils.ipHeaderLen(pkt)
        val flags = IpPacketUtils.tcpFlags(pkt, ipHL)
        val tcpHL = IpPacketUtils.tcpHeaderLen(pkt, ipHL)
        val srcIp = IpPacketUtils.ipSrcBytes(pkt)
        val dstIp = IpPacketUtils.ipDstBytes(pkt)
        val srcPort = IpPacketUtils.tcpSrcPort(pkt, ipHL)
        val dstPort = IpPacketUtils.tcpDstPort(pkt, ipHL)
        val appSeq = IpPacketUtils.tcpSeq(pkt, ipHL)
        val total = IpPacketUtils.ipTotalLen(pkt)
        val payload = if (total > ipHL + tcpHL) pkt.copyOfRange(ipHL + tcpHL, total) else ByteArray(0)
        val key = "${srcIp.joinToString(".")}:${srcPort}->${dstPort}"

        when {
            flags and IpPacketUtils.FLAG_SYN != 0 && flags and IpPacketUtils.FLAG_ACK == 0 -> {
                scope.launch(Dispatchers.IO) {
                    try {
                        val socket = SocketChannel.open()
                        vpn.protect(socket.socket())
                        socket.configureBlocking(false)
                        socket.connect(InetSocketAddress(IpPacketUtils.byteArrayToInetAddress(dstIp), dstPort))
                        val initSeq = (Math.random() * 0xFFFFFFFFL).toLong()
                        val session = TcpSession(socket, srcIp, dstIp, srcPort, dstPort, initSeq, appSeq + 1, tunOut)
                        sessions[key] = session
                        val deadline = System.currentTimeMillis() + 5000
                        while (!socket.finishConnect() && System.currentTimeMillis() < deadline) delay(50)
                        if (!socket.isConnected) { sessions.remove(key); return@launch }
                        delay(delayMs)
                        tunOut.write(IpPacketUtils.buildTcpPacket(dstIp, srcIp, dstPort, srcPort, initSeq, appSeq + 1, IpPacketUtils.FLAG_SYN or IpPacketUtils.FLAG_ACK))
                        session.localSeq++
                        startForwarder(key, session, delayMs)
                    } catch (_: Exception) { sessions.remove(key) }
                }
            }
            payload.isNotEmpty() -> {
                val s = sessions[key] ?: return
                s.localAck = appSeq + payload.size
                scope.launch(Dispatchers.IO) {
                    delay(delayMs)
                    try {
                        val buf = ByteBuffer.wrap(payload)
                        while (buf.hasRemaining()) s.socket.write(buf)
                        tunOut.write(IpPacketUtils.buildTcpPacket(dstIp, srcIp, dstPort, srcPort, s.localSeq, s.localAck, IpPacketUtils.FLAG_ACK))
                    } catch (_: Exception) { sessions.remove(key) }
                }
            }
            flags and IpPacketUtils.FLAG_FIN != 0 -> {
                val s = sessions.remove(key) ?: return
                scope.launch(Dispatchers.IO) {
                    delay(delayMs)
                    runCatching { s.socket.close() }
                    tunOut.write(IpPacketUtils.buildTcpPacket(dstIp, srcIp, dstPort, srcPort, s.localSeq, appSeq + 1, IpPacketUtils.FLAG_FIN or IpPacketUtils.FLAG_ACK))
                }
            }
        }
    }

    private fun startForwarder(key: String, s: TcpSession, delayMs: Long) {
        scope.launch(Dispatchers.IO) {
            val buf = ByteBuffer.allocate(8192)
            try {
                while (sessions.containsKey(key)) {
                    buf.clear()
                    val n = s.socket.read(buf)
                    if (n <= 0) break
                    delay(delayMs)
                    val pkt = IpPacketUtils.buildTcpPacket(s.dstIp, s.srcIp, s.dstPort, s.srcPort, s.localSeq, s.localAck, IpPacketUtils.FLAG_PSH or IpPacketUtils.FLAG_ACK, payload = buf.array().copyOf(n))
                    s.localSeq += n
                    s.tunOut.write(pkt)
                }
            } catch (_: Exception) {}
            sessions.remove(key)
            runCatching { s.socket.close() }
        }
    }

    fun closeAll() { sessions.values.forEach { runCatching { it.socket.close() } }; sessions.clear() }
}
