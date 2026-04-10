import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';

interface UsageHoursCounterProps {
  hours24h: number;
  hoursWeek: number;
  hoursMonth: number;
  hours6Months: number;
}

type Period = '24h' | 'week' | 'month' | '6months';
const CYCLE: Period[] = ['24h', 'week', 'month', '6months'];

function getPeriodLabel(period: Period): string {
  switch (period) {
    case '24h': return t('home.screenTimeLast24h');
    case 'week': return t('home.screenTimeLastWeek');
    case 'month': return t('home.screenTimeLastMonth');
    case '6months': return t('home.screenTimeLast6Months');
  }
}

export function UsageHoursCounter({ hours24h, hoursWeek, hoursMonth, hours6Months }: UsageHoursCounterProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [periodIdx, setPeriodIdx] = useState(0);

  const period = CYCLE[periodIdx];
  const hoursMap: Record<Period, number> = {
    '24h': hours24h,
    week: hoursWeek,
    month: hoursMonth,
    '6months': hours6Months,
  };
  const hours = hoursMap[period];
  const goalHours = period === '24h' ? 4 : period === 'week' ? 28 : period === 'month' ? 120 : 720;
  const isGood = hours < goalHours;
  const stateColor = isGood ? colors.success : colors.error;

  const handlePress = () => {
    setPeriodIdx(i => (i + 1) % CYCLE.length);
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <IconSymbol name="clock.fill" size={22} color={stateColor} />
        <ThemedText style={styles.title}>{t('home.screenTime')}</ThemedText>
        <View style={[styles.periodPill, { backgroundColor: colors.accent + '22' }]}>
          <ThemedText style={[styles.periodText, { color: colors.accent }]}>
            {period === '24h' ? '24h' : period === 'week' ? '7d' : period === 'month' ? '30d' : '6m'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        <ThemedText style={[styles.number, { color: colors.text }]}>
          {hours.toFixed(1)}
          <ThemedText style={styles.unit}>h</ThemedText>
        </ThemedText>
        <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
          {t('home.screenTimeLabel')} {getPeriodLabel(period)}
        </ThemedText>
      </View>

      <View style={[styles.statusRow, { borderTopColor: colors.border }]}>
        <IconSymbol
          name={isGood ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill'}
          size={16}
          color={stateColor}
        />
        <ThemedText style={[styles.statusText, { color: stateColor }]}>
          {isGood ? t('home.onTrack') : t('home.overQuota')}
        </ThemedText>
        <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
          {t('common.tapToChange')}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
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
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  periodPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  periodText: { fontSize: 12, fontWeight: '700' },
  content: { marginBottom: 4 },
  number: {
    fontSize: 52,
    fontWeight: '700',
    lineHeight: 60,
  },
  unit: {
    fontSize: 22,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  hint: { fontSize: 12 },
});
