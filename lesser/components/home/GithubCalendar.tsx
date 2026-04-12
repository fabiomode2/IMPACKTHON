import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { t } from '@/constants/i18n';
import { formatLocalISO } from '@/services/usage';

const GRID_GAP = 4;


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
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const { days, monthName } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // First day of month (0-6, where 0 is Sunday)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // Adjust to Monday = 0, Sunday = 6
    const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = now.toLocaleString('default', { month: 'long' });

    // Create the grid data
    const grid: { date: Date | null; usageMinutes: number }[] = [];
    
    // 1. Add padding for the first week
    for (let i = 0; i < startPadding; i++) {
        grid.push({ date: null, usageMinutes: -1 });
    }

    // 2. Add real days
    const dataMap = new Map(data.map(d => [formatLocalISO(d.date), d.usageMinutes]));

    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dStr = formatLocalISO(d);
        grid.push({
            date: d,
            usageMinutes: dataMap.get(dStr) ?? 0
        });
    }


    // 3. Optional: Add padding to fill the last row (we want 7 columns)
    // but the grid display handles that if we use flexWrap
    
    return { days: grid, monthName };
  }, [data]);

  const getIntensity = (minutes: number) => {
    if (minutes < 0) return -1;
    if (minutes <= 30) return 0; // Poco uso => Verde muy claro
    if (minutes <= 90) return 1;
    if (minutes <= 180) return 2;
    if (minutes <= 300) return 3;
    return 4; // Mucho uso => Verde oscuro
  };



  const getColor = (intensity: number) => {
    if (intensity < 0) return 'transparent';
    if (intensity === 0) return theme === 'light' ? '#EBEDF0' : '#2D333B'; // Github-like empty color

    // Scale from Light Green to Dark Green
    // Higher intensity => Darker color
    switch (intensity) {
      case 4: return '#216E39'; // Darkest Green
      case 3: return '#30A14E';
      case 2: return '#40C463';
      case 1: return '#9BE9A8'; // Lightest Green
      default: return colors.border;
    }
  };




  const dayLabels = [
    t('stats.days.mon').substring(0, 1),
    t('stats.days.tue').substring(0, 1),
    t('stats.days.wed').substring(0, 1),
    t('stats.days.thu').substring(0, 1),
    t('stats.days.fri').substring(0, 1),
    t('stats.days.sat').substring(0, 1),
    t('stats.days.sun').substring(0, 1),
  ];

  // Calculate square size based on 7 columns
  const numCols = 7;
  const totalGap = GRID_GAP * (numCols - 1);
  const squareSize = containerWidth > 0
    ? Math.floor((containerWidth - totalGap) / numCols)
    : 0;

  return (
    <View style={styles.outer} onLayout={onLayout}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{t('home.consistencyMap')}</ThemedText>
        <ThemedText style={[styles.monthLabel, { color: colors.textSecondary }]}>{monthName}</ThemedText>
      </View>

      {containerWidth > 0 && (
        <View style={styles.calendarContainer}>
          {/* Day Labels Row */}
          <View style={styles.labelsRow}>
            {dayLabels.map((l, i) => (
              <ThemedText key={i} style={[styles.labelText, { width: squareSize, color: colors.textSecondary }]}>
                {l}
              </ThemedText>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {days.map((day, idx) => (
              <View
                key={idx}
                style={[
                  styles.square,
                  {
                    width: squareSize,
                    height: squareSize * 0.8, // Increased height as requested
                    backgroundColor: getColor(getIntensity(day.usageMinutes)),
                  },
                ]}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.legend}>
        <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>{t('home.lessUsage')}</ThemedText>
        {[0, 1, 2, 3, 4].map(i => (
          <View key={i} style={[styles.legendSquare, { backgroundColor: getColor(i), borderColor: colors.border }]} />
        ))}
        <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>{t('home.moreUsage')}</ThemedText>
      </View>



    </View>
  );
}

const styles = StyleSheet.create({
  outer: { gap: 12, width: '100%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  monthLabel: {
    fontSize: 12,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  calendarContainer: {
    gap: 8,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    width: '100%',
  },
  square: {
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 4,
  },
  legendText: { fontSize: 11 },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
