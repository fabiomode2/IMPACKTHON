import React, { useState, useMemo } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { useUsageData } from '@/hooks/useUsageData';

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

function getSavingsComparison(savedHours: number): string {
  if (savedHours >= 8) return t('home.comparisons.got');
  if (savedHours >= 4) return t('home.comparisons.movie');
  if (savedHours >= 2) return t('home.comparisons.book');
  if (savedHours >= 0.5) return t('home.comparisons.film');
  return t('home.comparisons.nap');
}

/**
 * Aggregates raw usage data into chart-ready segments based on the period.
 */
function getChartData(dailyUsage: Record<string, { totalMinutes: number }>, period: ChartPeriod) {
  const now = new Date();
  const data: { label: string; hours: number }[] = [];

  switch (period) {
    case 'week': {
      const days = [t('stats.days.mon'), t('stats.days.tue'), t('stats.days.wed'), t('stats.days.thu'), t('stats.days.fri'), t('stats.days.sat'), t('stats.days.sun')];
      // Find current day 0-6 (Mon-Sun). JS date is 0-6 (Sun-Sat).
      // We want to show the current week Monday-Sunday.
      const currentDay = now.getDay(); // 0 is Sun
      const daysSinceMon = currentDay === 0 ? 6 : currentDay - 1;
      
      const mon = new Date(now);
      mon.setDate(now.getDate() - daysSinceMon);

      for (let i = 0; i < 7; i++) {
        const d = new Date(mon);
        d.setDate(mon.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        data.push({
          label: days[i],
          hours: (dailyUsage[dStr]?.totalMinutes || 0) / 60
        });
      }
      break;
    }
    case 'month': {
      // Group into 4 weeks
      for (let w = 3; w >= 0; w--) {
        let weekMins = 0;
        for (let d = 0; d < 7; d++) {
          const target = new Date(now);
          target.setDate(now.getDate() - (w * 7 + d));
          const targetStr = target.toISOString().split('T')[0];
          weekMins += dailyUsage[targetStr]?.totalMinutes || 0;
        }
        data.push({ label: `W${4 - w}`, hours: weekMins / (60 * 7) }); // Avg per day in that week
      }
      break;
    }
    case '3months': {
      for (let m = 2; m >= 0; m--) {
        const target = new Date(now.getFullYear(), now.getMonth() - m, 1);
        let monthMins = 0;
        let daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        
        for (let d = 1; d <= daysInMonth; d++) {
          const ds = new Date(target.getFullYear(), target.getMonth(), d).toISOString().split('T')[0];
          monthMins += dailyUsage[ds]?.totalMinutes || 0;
        }
        data.push({ 
          label: target.toLocaleString('default', { month: 'short' }), 
          hours: monthMins / (60 * daysInMonth) 
        });
      }
      break;
    }
    case 'year': {
      for (let m = 11; m >= 0; m--) {
        const target = new Date(now.getFullYear(), now.getMonth() - m, 1);
        let monthMins = 0;
        const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        
        for (let d = 1; d <= daysInMonth; d++) {
          const ds = new Date(target.getFullYear(), target.getMonth(), d).toISOString().split('T')[0];
          monthMins += dailyUsage[ds]?.totalMinutes || 0;
        }
        data.push({ 
          label: target.toLocaleString('default', { month: 'narrow' }), 
          hours: monthMins / (60 * daysInMonth) 
        });
      }
      break;
    }
  }
  return data;
}

function BarChart({ data }: { data: { label: string; hours: number }[] }) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const maxHours = Math.max(GOAL_HOURS + 1, ...data.map(d => d.hours));

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
  const { user } = useAuth();
  const { data: usageData, loading } = useUsageData(user?.uid);
  const [periodIdx, setPeriodIdx] = useState(0);
  const period = PERIOD_CYCLE[periodIdx];

  const dailyUsage = usageData?.rawUsage || {};
  
  const chartData = useMemo(() => getChartData(dailyUsage, period), [dailyUsage, period]);

  // KPI Calculations (based on last 7 days of raw data)
  const { avgDaily, totalSaved, daysOnGoal, bestDay } = useMemo(() => {
    let sumHours = 0;
    let saved = 0;
    let goalCount = 0;
    let minUsage = 24; // starting max
    let count = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const hours = (dailyUsage[dStr]?.totalMinutes || 0) / 60;
      
      sumHours += hours;
      saved += Math.max(0, GOAL_HOURS - hours);
      if (hours <= GOAL_HOURS && dailyUsage[dStr]) goalCount++;
      if (hours < minUsage) minUsage = hours;
      count++;
    }

    return {
      avgDaily: sumHours / 7,
      totalSaved: saved,
      daysOnGoal: goalCount,
      bestDay: minUsage === 24 ? 0 : minUsage
    };
  }, [dailyUsage]);

  const comparison = getSavingsComparison(totalSaved);

  const summaryCards = [
    { label: t('stats.avgDaily'), value: `${avgDaily.toFixed(1)}h`, icon: 'clock.fill' as const, color: colors.accent },
    { label: t('stats.savedLabel'), value: `${totalSaved.toFixed(1)}h`, icon: 'star.fill' as const, color: colors.success },
    { label: t('stats.daysOnGoal'), value: `${daysOnGoal}/7`, icon: 'checkmark.circle.fill' as const, color: colors.success },
    { label: t('stats.bestDay'), value: `${bestDay.toFixed(1)}h`, icon: 'bolt.fill' as const, color: '#FF9500' },
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
          <BarChart data={chartData} />
        </TouchableOpacity>

        {/* Monthly snapshot */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.chartTitle}>{t('stats.monthlySnapshot')}</ThemedText>
          <View style={styles.monthlyRow}>
            {[
              { value: `${(usageData?.hoursMonth || 0).toFixed(0)}h`, label: t('stats.savedThisMonth') },
              { value: `${usageData?.streakDays ?? 0}🔥`, label: t('stats.dayStreak') },
              { value: `Top ${usageData?.topPercentage ?? 50}%`, label: t('stats.vsUsers') },
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
