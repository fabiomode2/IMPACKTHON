import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { t } from '@/constants/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 0; // zero since parent already has padding
const GRID_GAP = 3;

interface CalendarData {
  date: Date;
  usageMinutes: number;
}

interface GithubCalendarProps {
  data: CalendarData[];
}

export function GithubCalendar({ data }: GithubCalendarProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  // Fill to exactly 35 cells (5 weeks × 7 days)
  const padded = [...Array(Math.max(0, 35 - data.length)).fill({ date: new Date(0), usageMinutes: -1 }), ...data].slice(-35);

  const getIntensity = (minutes: number) => {
    if (minutes < 0) return -1;  // empty pad
    if (minutes < 30) return 4;
    if (minutes < 60) return 3;
    if (minutes < 120) return 2;
    return 1;
  };

  const getColor = (intensity: number) => {
    if (intensity < 0) return 'transparent';
    switch (intensity) {
      case 4: return colors.success;
      case 3: return colors.success + 'AA';
      case 2: return colors.success + '66';
      case 1: return colors.success + '33';
      default: return colors.border;
    }
  };

  // Split into 5 columns of 7 days
  const columns: typeof padded[] = [];
  for (let i = 0; i < padded.length; i += 7) {
    columns.push(padded.slice(i, i + 7));
  }

  // Compute square size to fill parent exactly
  const numCols = columns.length;
  const totalGap = GRID_GAP * (numCols - 1);
  const squareSize = Math.floor((SCREEN_WIDTH - 40 - PADDING * 2 - totalGap) / numCols);  // 40 = card padding (20*2)

  return (
    <View style={styles.outer}>
      <ThemedText style={styles.title}>{t('home.consistencyMap')}</ThemedText>
      <View style={styles.grid}>
        {columns.map((col, colIdx) => (
          <View key={colIdx} style={styles.column}>
            {col.map((day, dayIdx) => (
              <View
                key={dayIdx}
                style={[
                  styles.square,
                  {
                    width: squareSize,
                    height: squareSize,
                    backgroundColor: getColor(getIntensity(day.usageMinutes)),
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>{t('home.moreUsage')}</ThemedText>
        {[0, 1, 2, 3, 4].map(i => (
          <View key={i} style={[styles.legendSquare, { backgroundColor: getColor(i), borderColor: colors.border }]} />
        ))}
        <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>{t('home.lessUsage')}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { gap: 10 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  column: {
    gap: GRID_GAP,
    flex: 1,
  },
  square: {
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: 4,
  },
  legendText: { fontSize: 11 },
  legendSquare: {
    width: 9,
    height: 9,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
