import React, { useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, View, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';

import { StreakCounter } from '@/components/home/StreakCounter';
import { UsageHoursCounter } from '@/components/home/UsageHoursCounter';
import { TopUsersBadge } from '@/components/home/TopUsersBadge';
import { GithubCalendar } from '@/components/home/GithubCalendar';
import { MostUsedApps } from '@/components/home/MostUsedApps';
import { ThemedText } from '@/components/themed-text';
import { useAppTimeTracker } from '@/hooks/useAppTimeTracker';
import { checkAndPostMilestones } from '@/services/social';

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
  const { mode, username } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { totalUsageHours, formattedTime, permissionStatus, requestPermission } = useAppTimeTracker();

  // Mock Data — replace with usageService.fetchUsageStats(user.uid)
  const streakDays = 15;
  const usageHours24h = mode === 'hardcore' ? 1.5 : 3.5;
  const usageHoursWeek = 22.1;
  const usageHoursMonth = 88.4;
  const usageHours6Months = 510.2;
  const topPercentage = 15;

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkAndPostMilestones(user.uid, user.username, streakDays, topPercentage);
    }
  }, [user, streakDays, topPercentage]);

  const goalHours = 4;
  const savedToday = Math.max(0, goalHours - usageHours24h);
  const savedWeek = 12.4;
  const savedMonth = 42.1;
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

        {/* Permission Banner — only shown on Android when permission is denied */}
        {Platform.OS === 'android' && permissionStatus === 'denied' && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 0 }]}>
            <ThemedText style={{ fontSize: 16, fontWeight: 'bold' }}>{t('home.usagePermissionTitle')}</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, marginVertical: 8 }}>
              {t('home.usagePermissionDesc')}
            </ThemedText>
            <TouchableOpacity
              style={[styles.statsBtn, { backgroundColor: colors.accent, alignSelf: 'flex-start', marginTop: 8 }]}
              onPress={requestPermission}
            >
              <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>{t('home.grantPermissionBtn')}</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Usage hours — cycling taps, no navigation */}
        <UsageHoursCounter
          hours24h={permissionStatus === 'granted' ? totalUsageHours : usageHours24h}
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
          <ThemedText style={{ fontSize: 14, color: colors.textSecondary }}>Daily Screen Time</ThemedText>
          <ThemedText style={{ fontSize: 34, fontWeight: '800', color: colors.text, marginVertical: 4 }}>
            {formattedTime}
          </ThemedText>
          <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
            {totalUsageHours.toFixed(1)}h today
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