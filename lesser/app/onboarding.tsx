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
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  features: { icon: string; text: string }[];
  accentColor: string;
}[] = [
    {
      id: 'soft',
      name: 'Soft',
      emoji: '🌿',
      tagline: 'Awareness, not restriction.',
      description: 'Track your habits and build awareness without any hard blocks.',
      accentColor: '#34C759',
      features: [
        { icon: 'chart.bar.fill', text: 'Daily screen time tracking' },
        { icon: 'flame.fill', text: 'Streak counter with goal' },
        { icon: 'bell.fill', text: 'Gentle daily reminders' },
        { icon: 'person.2.fill', text: 'Social feed & friend progress' },
        { icon: 'calendar', text: '30-day consistency calendar' },
      ],
    },
    {
      id: 'mid',
      name: 'Mid',
      emoji: '🛡️',
      tagline: 'Active reduction.',
      description: 'Soft locks and warning screens nudge you off apps when you go over your daily goal.',
      accentColor: '#FF9500',
      features: [
        { icon: 'checkmark.circle.fill', text: 'All Soft features' },
        { icon: 'exclamationmark.triangle.fill', text: 'Warning screens on over-use' },
        { icon: 'timer', text: 'Per-app daily limits' },
        { icon: 'lock.fill', text: 'Temporary app access cooldowns' },
        { icon: 'star.fill', text: 'Leaderboard & top user badge' },
      ],
    },
    {
      id: 'hardcore',
      name: 'Hardcore',
      emoji: '🔥',
      tagline: 'Maximum enforcement.',
      description: 'Hard-locks, strict limits, and automatic accountability photos when you stare too long.',
      accentColor: '#FF3B30',
      features: [
        { icon: 'checkmark.circle.fill', text: 'All Mid features' },
        { icon: 'camera.fill', text: 'Auto photos when staring too long' },
      ],
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
          <ThemedText type="title" style={styles.title}>Choose Your Path</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tap a mode to select it. You can always change this later in Settings.
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
                  <ThemedText style={styles.emoji}>{mode.emoji}</ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.cardTitle, isSelected && { color: mode.accentColor }]}>
                      {mode.name} Mode
                    </ThemedText>
                    <ThemedText style={[styles.tagline, { color: colors.textSecondary }]}>
                      {mode.tagline}
                    </ThemedText>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: mode.accentColor }]}>
                      <IconSymbol name="checkmark.circle.fill" size={18} color="#FFF" />
                    </View>
                  )}
                </View>

                <ThemedText style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  {mode.description}
                </ThemedText>

                <View style={styles.features}>
                  {mode.features.map((f, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <IconSymbol name={f.icon as any} size={14} color={isSelected ? mode.accentColor : colors.textSecondary} />
                      <ThemedText style={[styles.featureText, { color: colors.textSecondary }]}>{f.text}</ThemedText>
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
              {selectedMode?.emoji} Start with {selectedMode?.name} Mode
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
  emoji: { fontSize: 28 },
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
