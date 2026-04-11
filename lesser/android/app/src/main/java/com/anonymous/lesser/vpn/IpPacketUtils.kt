package com.anonymous.lesser.vpn

object IpPacketUtils {
    const val PROTO_TCP = 6
    const val PROTO_UDP = 17

    const val FLAG_FIN = 0x01
    const val FLAG_SYN = 0x02
    const val FLAG_RST = 0x04
    const val FLAG_PSH = 0x08
    const val FLAG_ACK = 0x10

    fun ipVersion(pkt: ByteArray): Int = (pkt[0].toInt() shr 4) and 0xF
    fun ipHeaderLen(pkt: ByteArray): Int = (pkt[0].toInt() and 0xF) * 4
    fun ipTotalLen(pkt: ByteArray): Int =
        ((pkt[2].toInt() and 0xFF) shl 8) or (pkt[3].toInt() and 0xFF)
    fun ipProtocol(pkt: ByteArray): Int = pkt[9].toInt() and 0xFF
    fun ipSrcBytes(pkt: ByteArray): ByteArray = pkt.copyOfRange(12, 16)
    fun ipDstBytes(pkt: ByteArray): ByteArray = pkt.copyOfRange(16, 20)

    fun tcpSrcPort(pkt: ByteArray, ipHL: Int): Int =
        ((pkt[ipHL].toInt() and 0xFF) shl 8) or (pkt[ipHL + 1].toInt() and 0xFF)
    fun tcpDstPort(pkt: ByteArray, ipHL: Int): Int =
        ((pkt[ipHL + 2].toInt() and 0xFF) shl 8) or (pkt[ipHL + 3].toInt() and 0xFF)
    fun tcpSeq(pkt: ByteArray, ipHL: Int): Long =
        ((pkt[ipHL + 4].toLong() and 0xFF) shl 24) or
        ((pkt[ipHL + 5].toLong() and 0xFF) shl 16) or
        ((pkt[ipHL + 6].toLong() and 0xFF) shl 8)  or
        (pkt[ipHL + 7].toLong() and 0xFF)
    fun tcpAckNum(pkt: ByteArray, ipHL: Int): Long =
        ((pkt[ipHL + 8].toLong() and 0xFF) shl 24) or
        ((pkt[ipHL + 9].toLong() and 0xFF) shl 16) or
        ((pkt[ipHL + 10].toLong() and 0xFF) shl 8)  or
        (pkt[ipHL + 11].toLong() and 0xFF)
    fun tcpHeaderLen(pkt: ByteArray, ipHL: Int): Int =
        ((pkt[ipHL + 12].toInt() and 0xFF) shr 4) * 4
    fun tcpFlags(pkt: ByteArray, ipHL: Int): Int = pkt[ipHL + 13].toInt() and 0xFF

    fun udpSrcPort(pkt: ByteArray, ipHL: Int): Int =
        ((pkt[ipHL].toInt() and 0xFF) shl 8) or (pkt[ipHL + 1].toInt() and 0xFF)
    fun udpDstPort(pkt: ByteArray, ipHL: Int): Int =
        ((pkt[ipHL + 2].toInt() and 0xFF) shl 8) or (pkt[ipHL + 3].toInt() and 0xFF)

    fun internetChecksum(data: ByteArray): Short {
        var sum = 0L
        var i = 0
        while (i < data.size - 1) {
            sum += ((data[i].toLong() and 0xFF) shl 8) or (data[i + 1].toLong() and 0xFF)
            i += 2
        }
        if (data.size % 2 != 0)
            sum += (data.last().toLong() and 0xFF) shl 8
        while (sum shr 16 != 0L) sum = (sum and 0xFFFF) + (sum shr 16)
        return sum.inv().toShort()
    }

    private fun pseudoHeaderChecksum(
        srcIp: ByteArray, dstIp: ByteArray, proto: Int, data: ByteArray
    ): Short {
        val pseudo = ByteArray(12 + data.size)
        System.arraycopy(srcIp, 0, pseudo, 0, 4)
        System.arraycopy(dstIp, 0, pseudo, 4, 4)
        pseudo[8] = 0
        pseudo[9] = proto.toByte()
        pseudo[10] = (data.size shr 8).toByte()
        pseudo[11] = data.size.toByte()
        System.arraycopy(data, 0, pseudo, 12, data.size)
        return internetChecksum(pseudo)
    }

    fun buildIpHeader(srcIp: ByteArray, dstIp: ByteArray, proto: Int, payloadLen: Int): ByteArray {
        val h = ByteArray(20)
        h[0] = 0x45.toByte()
        val total = 20 + payloadLen
        h[2] = (total shr 8).toByte(); h[3] = total.toByte()
        h[6] = 0x40.toByte()
        h[8] = 64
        h[9] = proto.toByte()
        System.arraycopy(srcIp, 0, h, 12, 4)
        System.arraycopy(dstIp, 0, h, 16, 4)
        val cs = internetChecksum(h)
        h[10] = (cs.toInt() shr 8).toByte(); h[11] = cs.toByte()
        return h
    }

    fun buildTcpPacket(
        srcIp: ByteArray, dstIp: ByteArray,
        srcPort: Int, dstPort: Int,
        seq: Long, ack: Long, flags: Int,
        win: Int = 65535,
        payload: ByteArray = ByteArray(0)
    ): ByteArray {
        val tcp = ByteArray(20 + payload.size)
        tcp[0] = (srcPort shr 8).toByte(); tcp[1] = srcPort.toByte()
        tcp[2] = (dstPort shr 8).toByte(); tcp[3] = dstPort.toByte()
        tcp[4] = (seq shr 24).toByte(); tcp[5] = (seq shr 16).toByte()
        tcp[6] = (seq shr 8).toByte();  tcp[7] = seq.toByte()
        tcp[8] = (ack shr 24).toByte(); tcp[9] = (ack shr 16).toByte()
        tcp[10] = (ack shr 8).toByte(); tcp[11] = ack.toByte()
        tcp[12] = (5 shl 4).toByte()
        tcp[13] = flags.toByte()
        tcp[14] = (win shr 8).toByte(); tcp[15] = win.toByte()
        if (payload.isNotEmpty()) System.arraycopy(payload, 0, tcp, 20, payload.size)
        val cs = pseudoHeaderChecksum(srcIp, dstIp, PROTO_TCP, tcp)
        tcp[16] = (cs.toInt() shr 8).toByte(); tcp[17] = cs.toByte()
        return buildIpHeader(srcIp, dstIp, PROTO_TCP, tcp.size) + tcp
    }

    fun buildUdpPacket(
        srcIp: ByteArray, dstIp: ByteArray,
        srcPort: Int, dstPort: Int,
        payload: ByteArray
    ): ByteArray {
        val udpLen = 8 + payload.size
        val udp = ByteArray(udpLen)
        udp[0] = (srcPort shr 8).toByte(); udp[1] = srcPort.toByte()
        udp[2] = (dstPort shr 8).toByte(); udp[3] = dstPort.toByte()
        udp[4] = (udpLen shr 8).toByte();  udp[5] = udpLen.toByte()
        System.arraycopy(payload, 0, udp, 8, payload.size)
        val cs = pseudoHeaderChecksum(srcIp, dstIp, PROTO_UDP, udp)
        udp[6] = (cs.toInt() shr 8).toByte(); udp[7] = cs.toByte()
        return buildIpHeader(srcIp, dstIp, PROTO_UDP, udpLen) + udp
    }

    fun byteArrayToInetAddress(bytes: ByteArray): java.net.InetAddress =
        java.net.InetAddress.getByAddress(bytes)
}
