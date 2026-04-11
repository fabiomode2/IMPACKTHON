import { IconSymbol } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { AppState, NativeModules, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GithubCalendar } from '@/components/home/GithubCalendar';
import { MostUsedApps } from '@/components/home/MostUsedApps';
import { StreakCounter } from '@/components/home/StreakCounter';
import { TopUsersBadge } from '@/components/home/TopUsersBadge';
import { UsageHoursCounter } from '@/components/home/UsageHoursCounter';
import { ThemedText } from '@/components/themed-text';
import { useAppTimeTracker } from '@/hooks/useAppTimeTracker';
import { useUsageData } from '@/hooks/useUsageData';
import { checkAndPostMilestones } from '@/services/social';

import ReactNative from 'react-native';
const {BackgroundFabModule} = ReactNative.NativeModules;



function getSavingsText(savedHours: number): string {
  if (savedHours >= 12) return t('home.comparisons.show');
  if (savedHours >= 8) return t('home.comparisons.got');
  if (savedHours >= 4) return t('home.comparisons.movie');
  if (savedHours >= 2) return t('home.comparisons.book');
  if (savedHours >= 0.5) return t('home.comparisons.film');
  return t('home.comparisons.nap');
}

export default function HomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { user, mode, username } = useAuth();

  useEffect(() => {
    // Cada vez que 'mode' cambie en el estado de JS, 
    // se lo enviamos a Java.
    // Asumiendo que mode es: 'soft' (1), 'mid' (2), 'hardcore' (3)
    const modeInt = mode === 'hardcore' ? 3 : mode === 'mid' ? 2 : 1;
    
    if (BackgroundFabModule) {
      BackgroundFabModule.setModoFuncionamiento(modeInt);
    }
  }, [mode]); // <--- Se ejecuta cuando cambia 'mode'

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formattedTime, activeTimeHours } = useAppTimeTracker();
  const { data: stats, loading } = useUsageData(user?.uid);

  // Stats from RTDB
  const streakDays = stats?.streakDays ?? 0;
  const usageHours24h = stats?.hours24h ?? 0;
  const usageHoursWeek = stats?.hoursWeek ?? 0;
  const usageHoursMonth = stats?.hoursMonth ?? 0;
  const usageHours6Months = stats?.hours6Months ?? 0;
  const topPercentage = stats?.topPercentage ?? 50;

  const [hasUsagePermission, setHasUsagePermission] = useState<boolean>(true);
  const [realUsageHours24h, setRealUsageHours24h] = useState<number>(usageHours24h);

  useEffect(() => {
    const { AppUsageModule } = NativeModules;

    async function fetchStats() {
      if (!AppUsageModule) return;
      try {
        const permitted = await AppUsageModule.checkPermission();
        setHasUsagePermission(permitted);
        if (permitted) {
          const stats = await AppUsageModule.getDailyUsageStats();
          if (stats && Array.isArray(stats)) {
            // Sum all usageTime (which is in minutes) and convert to hours
            const totalMinutes = stats.reduce((acc: number, app: any) => acc + (app.usageTime || 0), 0);
            setRealUsageHours24h(totalMinutes / 60);
          }
        }
      } catch (e) {
        console.error("Error fetching usage stats", e);
      }
    }

    fetchStats();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') fetchStats();
    });

    return () => {
      subscription.remove();
    };
  }, []);


  useEffect(() => {
    if (user && stats) {
      checkAndPostMilestones(user.uid, user.username, streakDays, topPercentage);
    }
  }, [user, streakDays, topPercentage, stats]);

  const goalHours = 4;
  const savedToday = Math.max(0, goalHours - usageHours24h);
  const savedWeek = Math.max(0, (goalHours * 7) - usageHoursWeek);
  const savedMonth = Math.max(0, (goalHours * 30) - usageHoursMonth);
  const savingsText = getSavingsText(savedWeek);

  const calendarData = useMemo(() => Array.from({ length: 35 }, (_, i) => ({
    date: new Date(Date.now() - (34 - i) * 24 * 60 * 60 * 1000),
    usageMinutes: Math.floor(Math.random() * 140),
  })), []);

  const mostUsedApps = [
    { name: 'Instagram', usageTime: 120, icon: 'camera' },
    { name: 'TikTok', usageTime: 95, icon: 'music-note' },
    { name: 'WhatsApp', usageTime: 60, icon: 'message-square' },
    { name: 'YouTube', usageTime: 45, icon: 'tv' },
    { name: 'Twitter/X', usageTime: 30, icon: 'message-circle' },
  ];


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={[styles.greeting, { color: colors.textSecondary }]}>
              {t('home.greeting')}
            </ThemedText>
            <ThemedText style={styles.name}>
              {username ?? t('home.greetingGuest')} 👋
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.statsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/stats')}
          >
            <IconSymbol name="chart.bar.fill" size={18} color={colors.accent} />
            <ThemedText style={[styles.statsBtnText, { color: colors.accent }]}>
              {t('home.statsButton')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Streak */}
        <StreakCounter days={streakDays} />

        {/* Permission Banner */}
        {!hasUsagePermission && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 0 }]}>
            <ThemedText style={{ fontSize: 16, fontWeight: 'bold' }}>{t('home.usagePermissionTitle')}</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, marginVertical: 8 }}>
              {t('home.usagePermissionDesc')}
            </ThemedText>
            <TouchableOpacity
              style={[styles.statsBtn, { backgroundColor: colors.accent, alignSelf: 'flex-start', marginTop: 8 }]}
              onPress={() => NativeModules.AppUsageModule?.requestPermission()}
            >
              <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>{t('home.grantPermissionBtn')}</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Usage hours — cycling taps, no navigation */}
        <UsageHoursCounter
          hours24h={hasUsagePermission ? realUsageHours24h : usageHours24h}
          hoursWeek={usageHoursWeek}
          hoursMonth={usageHoursMonth}
          hours6Months={usageHours6Months}
        />

        {/* Top users badge */}
        <TopUsersBadge percentage={topPercentage} />

        {/* Time Saved — taps go to stats */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/stats')}
          style={[styles.savingsCard, { backgroundColor: colors.accent }]}
        >
          <View style={styles.savingsHeader}>
            <IconSymbol name="bolt.fill" size={16} color="rgba(255,255,255,0.85)" />
            <ThemedText style={styles.savingsTitle}>{t('home.timeSaved')}</ThemedText>
          </View>
          <View style={styles.savingsRow}>
            <View style={styles.savingsItem}>
              <ThemedText style={styles.savingsValue}>{savedToday.toFixed(1)}h</ThemedText>
              <ThemedText style={styles.savingsLabel}>{t('home.timeSavedToday')}</ThemedText>
            </View>
            <View style={styles.savingsDivider} />
            <View style={styles.savingsItem}>
              <ThemedText style={styles.savingsValue}>{savedWeek.toFixed(1)}h</ThemedText>
              <ThemedText style={styles.savingsLabel}>{t('home.timeSavedWeek')}</ThemedText>
            </View>
            <View style={styles.savingsDivider} />
            <View style={styles.savingsItem}>
              <ThemedText style={styles.savingsValue}>{savedMonth.toFixed(0)}h</ThemedText>
              <ThemedText style={styles.savingsLabel}>{t('home.timeSavedMonth')}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.savingsComparison}>
            {t('home.timeSavedComparison', { what: savingsText })}
          </ThemedText>
        </TouchableOpacity>

        {/* Calendar — taps go to stats */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/stats')}
          style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <GithubCalendar data={calendarData} />
        </TouchableOpacity>

        {/* Most used apps */}
        <MostUsedApps apps={mostUsedApps} />

        {/* Live Active Timer */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 4, alignItems: 'center' }]}>
          <IconSymbol name="timer" size={24} color={colors.accent} style={{ marginBottom: 4 }} />
          <ThemedText style={{ fontSize: 14, color: colors.textSecondary }}>Live App Active Time</ThemedText>
          <ThemedText style={{ fontSize: 34, fontWeight: '800', color: colors.text, marginVertical: 4 }}>
            {formattedTime}
          </ThemedText>
          <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
            {activeTimeHours.toFixed(4)}h / 6.0000h max
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  greeting: { fontSize: 15 },
  name: { fontSize: 26, fontWeight: '800' },
  statsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statsBtnText: { fontSize: 14, fontWeight: '600' },
  savingsCard: {
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingsTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  savingsItem: { flex: 1, alignItems: 'center', gap: 2 },
  savingsDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  savingsValue: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  savingsLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  savingsComparison: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
});