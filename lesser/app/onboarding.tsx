import { t } from '@/constants/i18n';
import React, { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Animated,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Mode } from '@/services/auth';

const MODES: {
  id: Mode;
  icon: any;
  accentColor: string;
}[] = [
    {
      id: 'soft',
      icon: 'leaf.fill',
      accentColor: '#34C759',
    },
    {
      id: 'mid',
      icon: 'shield.fill',
      accentColor: '#FF9500',
    },
    {
      id: 'hardcore',
      icon: 'flame.fill',
      accentColor: '#FF3B30',
    },
  ];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [selected, setSelected] = useState<Mode | null>(null);

  const selectedMode = MODES.find(m => m.id === selected);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>{t('onboarding.title')}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('onboarding.subtitle')}
          </ThemedText>
        </View>

        <View style={styles.cards}>
          {MODES.map((mode) => {
            const isSelected = selected === mode.id;
            return (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? mode.accentColor : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setSelected(mode.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: isSelected ? mode.accentColor + '15' : colors.border + '30' }]}>
                    <IconSymbol name={mode.icon} size={24} color={isSelected ? mode.accentColor : colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.cardTitle, isSelected && { color: mode.accentColor }]}>
                      {t(`onboarding.${mode.id}.name`)}
                    </ThemedText>
                    <ThemedText style={[styles.tagline, { color: colors.textSecondary }]}>
                      {t(`onboarding.${mode.id}.tagline`)}
                    </ThemedText>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: mode.accentColor }]}>
                      <IconSymbol name="checkmark.circle.fill" size={18} color="#FFF" />
                    </View>
                  )}
                </View>

                <ThemedText style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  {t(`onboarding.${mode.id}.description`)}
                </ThemedText>

                <View style={styles.features}>
                  {Array.isArray(t(`onboarding.${mode.id}.features`)) && 
                   ((t(`onboarding.${mode.id}.features`) as unknown) as string[]).map((f, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <IconSymbol name="checkmark.circle.fill" size={14} color={isSelected ? mode.accentColor : colors.textSecondary} />
                      <ThemedText style={[styles.featureText, { color: colors.textSecondary }]}>{f}</ThemedText>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom padding so nothing hides behind button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky confirm button */}
      {selected !== null && (
        <View style={[styles.buttonContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: selectedMode?.accentColor ?? colors.accent },
            ]}
            onPress={() => selected && completeOnboarding(selected)}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.confirmText}>
              {t('onboarding.confirmButton', { mode: t(`onboarding.${selectedMode?.id}.name`) })}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 60 },
  header: { marginBottom: 32 },
  title: { fontSize: 34, marginBottom: 12 },
  subtitle: { fontSize: 16, lineHeight: 24 },
  cards: { gap: 14 },
  card: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 20, fontWeight: '700' },
  tagline: { fontSize: 13, marginTop: 2 },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDescription: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  features: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, flex: 1 },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 0.5,
  },
  confirmButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
