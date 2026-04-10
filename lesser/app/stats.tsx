import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';

const BAR_MAX_HEIGHT = 120;
const GOAL_HOURS = 4;

type ChartPeriod = 'week' | 'month' | '3months' | 'year';
const PERIOD_CYCLE: ChartPeriod[] = ['week', 'month', '3months', 'year'];

function periodLabel(p: ChartPeriod): string {
  switch (p) {
    case 'week': return t('stats.week');
    case 'month': return t('stats.month');
    case '3months': return t('stats.threeMonths');
    case 'year': return t('stats.year');
  }
}

// Mock data for multiple periods
const CHART_DATA: Record<ChartPeriod, { label: string; hours: number }[]> = {
  week: [
    { label: 'Mon', hours: 4.2 }, { label: 'Tue', hours: 3.1 },
    { label: 'Wed', hours: 5.5 }, { label: 'Thu', hours: 2.8 },
    { label: 'Fri', hours: 3.9 }, { label: 'Sat', hours: 6.1 }, { label: 'Sun', hours: 1.5 },
  ],
  month: [
    { label: 'W1', hours: 4.1 }, { label: 'W2', hours: 3.5 },
    { label: 'W3', hours: 5.2 }, { label: 'W4', hours: 2.9 },
  ],
  '3months': [
    { label: 'Jan', hours: 4.8 }, { label: 'Feb', hours: 3.9 }, { label: 'Mar', hours: 3.2 },
  ],
  year: [
    { label: 'J', hours: 5.2 }, { label: 'F', hours: 4.8 }, { label: 'M', hours: 4.1 },
    { label: 'A', hours: 3.8 }, { label: 'M', hours: 3.5 }, { label: 'J', hours: 6.1 },
    { label: 'J', hours: 5.9 }, { label: 'A', hours: 4.2 }, { label: 'S', hours: 3.1 },
    { label: 'O', hours: 2.8 }, { label: 'N', hours: 3.4 }, { label: 'D', hours: 4.0 },
  ],
};

function getSavingsComparison(savedHours: number): string {
  if (savedHours >= 8) return t('home.comparisons.got');
  if (savedHours >= 4) return t('home.comparisons.movie');
  if (savedHours >= 2) return t('home.comparisons.book');
  if (savedHours >= 0.5) return t('home.comparisons.film');
  return t('home.comparisons.nap');
}

function BarChart({ period }: { period: ChartPeriod }) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const data = CHART_DATA[period];
  const maxHours = Math.max(...data.map(d => d.hours));

  return (
    <View>
      <View style={styles.bars}>
        {data.map((item, i) => {
          const height = Math.max(4, (item.hours / maxHours) * BAR_MAX_HEIGHT);
          const isOver = item.hours > GOAL_HOURS;
          const barColor = isOver ? colors.error : colors.success;
          return (
            <View key={i} style={styles.barCol}>
              <ThemedText style={[styles.barValue, { color: barColor }]}>
                {item.hours.toFixed(1)}
              </ThemedText>
              <View style={[styles.bar, { height, backgroundColor: barColor + 'CC' }]} />
              <ThemedText style={[styles.barLabel, { color: colors.textSecondary }]}>
                {item.label}
              </ThemedText>
            </View>
          );
        })}
      </View>
      <View style={[styles.goalLine, { borderColor: colors.accent }]}>
        <ThemedText style={[styles.goalLineLabel, { color: colors.accent }]}>
          {t('stats.goalLine', { h: GOAL_HOURS })}
        </ThemedText>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [periodIdx, setPeriodIdx] = useState(0);
  const period = PERIOD_CYCLE[periodIdx];

  const weekData = CHART_DATA.week;
  const totalSaved = weekData.reduce((acc, d) => acc + Math.max(0, GOAL_HOURS - d.hours), 0);
  const avgDaily = weekData.reduce((s, d) => s + d.hours, 0) / weekData.length;
  const comparison = getSavingsComparison(totalSaved);

  const summaryCards = [
    { label: t('stats.avgDaily'), value: `${avgDaily.toFixed(1)}h`, icon: 'clock.fill' as const, color: colors.accent },
    { label: t('stats.savedLabel'), value: `${totalSaved.toFixed(1)}h`, icon: 'star.fill' as const, color: colors.success },
    { label: t('stats.daysOnGoal'), value: `${weekData.filter(d => d.hours <= GOAL_HOURS).length}/7`, icon: 'checkmark.circle.fill' as const, color: colors.success },
    { label: t('stats.bestDay'), value: `${Math.min(...weekData.map(d => d.hours)).toFixed(1)}h`, icon: 'bolt.fill' as const, color: '#FF9500' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerRow, { marginTop: insets.top > 0 ? 8 : 52 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={22} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.pageTitle} numberOfLines={1} adjustsFontSizeToFit>
          {t('stats.title')}
        </ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Savings hero */}
        <View style={[styles.savingsCard, { backgroundColor: colors.accent }]}>
          <ThemedText style={styles.savingsLabel}>{t('stats.savedThisWeek')}</ThemedText>
          <ThemedText style={styles.savingsHours}>{totalSaved.toFixed(1)} hours</ThemedText>
          <ThemedText style={styles.savingsComparison}>
            {t('stats.watchEquivalent', { what: comparison })}
          </ThemedText>
        </View>

        {/* KPI grid */}
        <View style={styles.summaryGrid}>
          {summaryCards.map((card, i) => (
            <View
              key={i}
              style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <IconSymbol name={card.icon} size={20} color={card.color} />
              <ThemedText style={[styles.summaryValue, { color: colors.text }]}>{card.value}</ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>{card.label}</ThemedText>
            </View>
          ))}
        </View>

        {/* Tappable bar chart with period cycling */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setPeriodIdx(i => (i + 1) % PERIOD_CYCLE.length)}
        >
          <View style={styles.chartHeader}>
            <ThemedText style={styles.chartTitle}>{periodLabel(period)}</ThemedText>
            <View style={[styles.cyclePill, { backgroundColor: colors.accent + '22' }]}>
              <ThemedText style={[styles.cycleText, { color: colors.accent }]}>
                {t('stats.tapToCycle')}
              </ThemedText>
            </View>
          </View>
          <BarChart period={period} />
        </TouchableOpacity>

        {/* Monthly snapshot */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.chartTitle}>{t('stats.monthlySnapshot')}</ThemedText>
          <View style={styles.monthlyRow}>
            {[
              { value: '42h', label: t('stats.savedThisMonth') },
              { value: '15🔥', label: t('stats.dayStreak') },
              { value: 'Top 15%', label: t('stats.vsUsers') },
            ].map((item, i, arr) => (
              <React.Fragment key={i}>
                <View style={styles.monthlyItem}>
                  <ThemedText style={[styles.monthlyValue, { color: colors.text }]}>{item.value}</ThemedText>
                  <ThemedText style={[styles.monthlyLabel, { color: colors.textSecondary }]}>{item.label}</ThemedText>
                </View>
                {i < arr.length - 1 && <View style={[styles.monthlyDivider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  scroll: {
    padding: 16,
    gap: 14,
  },
  savingsCard: {
    borderRadius: 20,
    padding: 24,
    gap: 6,
  },
  savingsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  savingsHours: {
    color: '#FFF',
    fontSize: 38,
    fontWeight: '800',
  },
  savingsComparison: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 21,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minWidth: '44%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 6,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  cyclePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cycleText: { fontSize: 11, fontWeight: '600' },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT + 60,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barValue: {
    fontSize: 9,
    fontWeight: '600',
  },
  bar: {
    width: '70%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 10,
  },
  goalLine: {
    marginTop: 8,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    paddingTop: 4,
    alignItems: 'flex-end',
  },
  goalLineLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 12,
  },
  monthlyItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  monthlyDivider: {
    width: 1,
    height: 40,
  },
  monthlyValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  monthlyLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
});
