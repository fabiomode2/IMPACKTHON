import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';

interface StreakCounterProps {
  days: number;
}

function getFlameColor(days: number): string {
  if (days >= 30) return '#FF3B30'; // Red — legendary
  if (days >= 14) return '#FF9500'; // Orange — great
  if (days >= 7) return '#FFCC00';  // Yellow — good
  return '#34C759';                  // Green — just started
}

export function StreakCounter({ days }: StreakCounterProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const flameColor = getFlameColor(days);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <IconSymbol name="flame.fill" size={24} color={flameColor} />
        <ThemedText style={styles.title}>{t('home.streak')}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText style={[styles.number, { color: colors.text }]}>{days}</ThemedText>
        <View style={styles.labelColumn}>
          <ThemedText style={[styles.dayLabel, { color: flameColor }]}>
            {days === 1 ? t('home.streakDay').split(' ')[1] : t('home.streakDays', { count: '' }).trim()}
          </ThemedText>
          <ThemedText style={[styles.label, { color: colors.textSecondary }]}>{t('home.streakGoal')}</ThemedText>
        </View>
      </View>
      <View style={[styles.badge, { backgroundColor: flameColor + '22' }]}>
        <IconSymbol name="flame.fill" size={12} color={flameColor} />
        <ThemedText style={[styles.badgeText, { color: flameColor }]}>
          {days >= 30 ? t('home.badgeLegendary') : days >= 14 ? t('home.badgeFire') : days >= 7 ? t('home.badgeGreat') : t('home.badgeKeepUp')}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  number: {
    fontSize: 80,
    fontWeight: '800',
    lineHeight: 88,
  },
  labelColumn: {
    paddingBottom: 10,
    gap: 2,
  },
  dayLabel: {
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

