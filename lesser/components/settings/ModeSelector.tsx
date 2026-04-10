import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';
import { Mode } from '@/services/auth';

const MODES: {
  id: Mode;
  name: string;
  emoji: string;
  features: string[];
}[] = [
  {
    id: 'soft',
    name: 'Soft Mode',
    emoji: '🌿',
    features: [
      'Daily screen time tracking',
      'Streak counter with goal',
      'Gentle daily reminders',
      'Social feed & friend progress',
      '30-day consistency calendar',
    ],
  },
  {
    id: 'mid',
    name: 'Mid Mode',
    emoji: '🛡️',
    features: [
      'All Soft features',
      'Warning screens on over-use',
      'Per-app daily limits',
      'Temporary app access cooldowns',
      'Leaderboard & top user badge',
    ],
  },
  {
    id: 'hardcore',
    name: 'Hardcore Mode',
    emoji: '🔥',
    features: [
      'All Mid features',
      'Hard app locks — no override',
      'Auto photos when staring too long',
      'Photos shared to social feed',
      'Emergency unlock only via friend',
    ],
  },
];

export function ModeSelector() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { mode, setMode } = useAuth();
  const [pendingMode, setPendingMode] = useState<typeof MODES[0] | null>(null);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>App Mode</ThemedText>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {MODES.map((item, index) => {
          const isActive = mode === item.id;
          return (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => setPendingMode(item)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.modeEmoji}>{item.emoji}</ThemedText>
                <View style={styles.modeInfo}>
                  <ThemedText style={[styles.modeText, isActive && { fontWeight: '700' }]}>
                    {item.name}
                  </ThemedText>
                  <ThemedText style={[styles.featureCount, { color: colors.textSecondary }]}>
                    {item.features.length} features
                  </ThemedText>
                </View>
                {isActive && <IconSymbol name="checkmark.circle.fill" size={24} color={colors.accent} />}
                {!isActive && <IconSymbol name="chevron.right" size={18} color={colors.icon} />}
              </TouchableOpacity>
              {index < MODES.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </React.Fragment>
          );
        })}
      </View>

      {/* Mode Detail & Confirm Modal */}
      <Modal
        visible={pendingMode !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPendingMode(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setPendingMode(null)}>
          <Pressable style={[styles.modal, { backgroundColor: colors.card }]} onPress={() => {}}>
            <ThemedText style={styles.modalEmoji}>{pendingMode?.emoji}</ThemedText>
            <ThemedText style={styles.modalTitle}>{pendingMode?.name}</ThemedText>

            <View style={styles.featureList}>
              {pendingMode?.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                  <ThemedText style={[styles.featureText, { color: colors.text }]}>{f}</ThemedText>
                </View>
              ))}
            </View>

            {mode === pendingMode?.id ? (
              <View style={[styles.activeChip, { backgroundColor: colors.success + '22' }]}>
                <ThemedText style={{ color: colors.success, fontWeight: '600' }}>Currently active</ThemedText>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.accent }]}
                onPress={() => { setMode(pendingMode!.id); setPendingMode(null); }}
              >
                <ThemedText style={styles.confirmText}>Switch to {pendingMode?.name}</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setPendingMode(null)}>
              <ThemedText style={{ color: colors.textSecondary }}>Cancel</ThemedText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  modeEmoji: { fontSize: 24 },
  modeInfo: { flex: 1 },
  modeText: { fontSize: 17 },
  featureCount: { fontSize: 12, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 58 },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    gap: 12,
    alignItems: 'center',
  },
  modalEmoji: { fontSize: 44, marginBottom: 4 },
  modalTitle: { fontSize: 24, fontWeight: '700' },
  featureList: { width: '100%', gap: 10, marginVertical: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 15, flex: 1 },
  activeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  confirmButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  confirmText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 24, marginBottom: 8 },
});
