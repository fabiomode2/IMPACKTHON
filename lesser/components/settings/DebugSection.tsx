import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch, Platform, Modal, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { silentNudgeService } from '@/services/silentNudgeService';

/**
 * components/settings/DebugSection.tsx
 *
 * A debugging section for developers to test nudge logic.
 * Opens in a modal to stay out of the way of normal users.
 */

export function DebugSection() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [isDebugActive, setIsDebugActive] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const toggleDebug = (enabled: boolean) => {
    setIsDebugActive(enabled);
    silentNudgeService.toggleDebugMode(enabled);
  };

  if (Platform.OS !== 'android') return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.debugButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setModalVisible(true)}
      >
        <IconSymbol name="ladybug.fill" size={20} color={colors.accent} />
        <ThemedText style={styles.debugButtonText}>Debug Tools</ThemedText>
        <IconSymbol name="chevron.right" size={16} color={colors.icon} />
      </TouchableOpacity>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Developer Debug</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.row}>
                <View style={styles.info}>
                  <ThemedText style={styles.title}>Test Silent Nudge</ThemedText>
                  <ThemedText style={[styles.desc, { color: colors.textSecondary }]}>
                    Force Cycle: 30s Muted / 30s Unmuted.
                  </ThemedText>
                </View>
                <Switch
                  value={isDebugActive}
                  onValueChange={toggleDebug}
                  trackColor={{ false: colors.border, true: colors.accent }}
                />
              </View>
              {isDebugActive && (
                <ThemedText style={[styles.activeWarning, { color: colors.accent }]}>
                  ⚠️ Debug cycle is running...
                </ThemedText>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: colors.accent }]}
              onPress={() => setModalVisible(false)}
            >
              <ThemedText style={styles.closeButtonText}>Done</ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  debugButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 48,
    gap: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
  activeWarning: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  closeButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
