import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
// import { Slider } from 'react-native-gesture-handler'; 
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { Mode } from '@/services/auth';
import { t } from '@/constants/i18n';


import ReactNative from 'react-native';
const {BackgroundFabModule} = ReactNative.NativeModules;


const MODES: {
  id: Mode;
  icon: any;
}[] = [
  {
    id: 'soft',
    icon: 'leaf.fill',
  },
  {
    id: 'mid',
    icon: 'shield.fill',
  },
  {
    id: 'hardcore',
    icon: 'flame.fill',
  },
];

export function ModeSelector() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { mode, setMode, user } = useAuth();

  useEffect(() => {
    // Cada vez que 'mode' cambie en el estado de JS, 
    // se lo enviamos a Java.
    // Asumiendo que mode es: 'soft' (1), 'mid' (2), 'hardcore' (3)
    const modeInt = mode === 'hardcore' ? 3 : mode === 'mid' ? 2 : 1;
    
    if (BackgroundFabModule) {
      BackgroundFabModule.setModoFuncionamiento(modeInt);
    }
  }, [mode]); // <--- Se ejecuta cuando cambia 'mode'


  const [pendingMode, setPendingMode] = useState<typeof MODES[0] | null>(null);
  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>{t('settings.appMode')}</ThemedText>
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
                <View style={[styles.iconContainer, { backgroundColor: colors.accent + '15' }]}>
                  <IconSymbol name={item.icon} size={20} color={colors.accent} />
                </View>
                <View style={styles.modeInfo}>
                  <ThemedText style={[styles.modeText, isActive && { fontWeight: '700' }]}>
                    {t(`onboarding.${item.id}.name`)}
                  </ThemedText>
                  <ThemedText style={[styles.featureCount, { color: colors.textSecondary }]}>
                    {(() => {
                      const features = t(`onboarding.${item.id}.features`);
                      const count = Array.isArray(features) ? features.length : 5;
                      return t('settings.features', { n: count });
                    })()}
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
            <View style={[styles.modalIconContainer, { backgroundColor: colors.accent + '15' }]}>
              <IconSymbol name={pendingMode?.icon} size={40} color={colors.accent} />
            </View>
            <ThemedText style={styles.modalTitle}>{t(`onboarding.${pendingMode?.id}.name`)}</ThemedText>

            <View style={styles.featureList}>
              {pendingMode && Array.isArray(t(`onboarding.${pendingMode.id}.features`)) && 
                (t(`onboarding.${pendingMode.id}.features`) as unknown as string[]).map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                  <ThemedText style={[styles.featureText, { color: colors.text }]}>{f}</ThemedText>
                </View>
              ))}
            </View>

            {mode === pendingMode?.id ? (
              <View style={[styles.activeChip, { backgroundColor: colors.success + '22' }]}>
                <ThemedText style={{ color: colors.success, fontWeight: '600' }}>{t('settings.currentlyActive')}</ThemedText>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.accent }]}
                onPress={() => { setMode(pendingMode!.id); setPendingMode(null); }}
              >
                <ThemedText style={styles.confirmText}>
                  {t('settings.switchTo', { mode: t(`onboarding.${pendingMode?.id}.name`) })}
                </ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setPendingMode(null)}>
              <ThemedText style={{ color: colors.textSecondary }}>{t('common.cancel')}</ThemedText>
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeInfo: { flex: 1 },
  modeText: { fontSize: 17 },
  featureCount: { fontSize: 12, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 58 },
  // Nudge Card
  nudgeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
    gap: 16,
  },
  nudgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  nudgeTitleGroup: {
    flex: 1,
    gap: 4,
  },
  nudgeTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  nudgeDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  thresholdContainer: {
    gap: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(142, 142, 147, 0.2)',
  },
  thresholdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thresholdLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  thresholdValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  thresholdControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thresholdChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  thresholdChipText: {
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
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
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
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
