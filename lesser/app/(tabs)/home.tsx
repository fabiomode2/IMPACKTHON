import React, { useEffect } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, View, TouchableOpacity, ActivityIndicator, AppState } from 'react-native';
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
import { generateMotivationalMessage } from '@/services/llm';
import { hasPermission, requestPermission, getDailyUsageStats } from '../../modules/expo-app-usage';

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
  const { formattedTime, activeTimeHours } = useAppTimeTracker();

  const [hasUsagePerm, setHasUsagePerm] = React.useState(true);
  const [realUsageHours24h, setRealUsageHours24h] = React.useState(0);
  const [realMostUsedApps, setRealMostUsedApps] = React.useState<any[]>([]);

  useEffect(() => {
    const checkPerm = () => {
      try {
        const perm = hasPermission();
        setHasUsagePerm(perm);
        if (perm) {
          const stats = getDailyUsageStats();
          setRealUsageHours24h(stats.totalHours || 0);
          if (stats.apps && stats.apps.length > 0) {
            setRealMostUsedApps(stats.apps);
          }
        }
      } catch (e) {
        console.warn("Usage Stats not available:", e);
      }
    };
    checkPerm();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') { checkPerm(); }
    });
    return () => subscription.remove();
  }, []);

  // Mock Data fallback — replace with usageService.fetchUsageStats(user.uid)
  const streakDays = 15;
  const usageHours24h = realUsageHours24h > 0 ? realUsageHours24h : (mode === 'hardcore' ? 1.5 : 3.5);
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
  
  const [aiMessage, setAiMessage] = React.useState<string | null>(null);

  useEffect(() => {
    async function loadAIMessage() {
      const stats = {
        savedHoursWeek: savedWeek,
        streakDays: streakDays,
        usageHours24h: usageHours24h,
        goalHours: goalHours,
        topPercentage: topPercentage,
      };
      const appUsages = mostUsedApps.map((app) => ({
        name: app.name,
        minutes: app.usageTime,
      }));
      const msg = await generateMotivationalMessage(username ?? 'Usuario', mode, stats, appUsages);
      setAiMessage(msg);
    }
    loadAIMessage();
  }, [savedWeek, streakDays, username, mode, usageHours24h, goalHours, topPercentage]);

  const calendarData = Array.from({ length: 35 }, (_, i) => ({
    date: new Date(Date.now() - (34 - i) * 24 * 60 * 60 * 1000),
    usageMinutes: Math.floor(Math.random() * 140),
  }));

  const fallbackMostUsedApps = [
    { name: 'Instagram', usageTime: 120, icon: 'camera' },
    { name: 'TikTok', usageTime: 95, icon: 'music-note' },
    { name: 'WhatsApp', usageTime: 60, icon: 'message-square' },
    { name: 'YouTube', usageTime: 45, icon: 'tv' },
    { name: 'Twitter/X', usageTime: 30, icon: 'message-circle' },
  ];
  
  const mostUsedApps = realMostUsedApps.length > 0 ? realMostUsedApps : fallbackMostUsedApps;

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

        {/* Permission Request Banner */}
        {!hasUsagePerm && (
          <TouchableOpacity
            style={[styles.section, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}
            onPress={() => requestPermission()}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>Activar Estadísticas</ThemedText>
                <ThemedText style={{ fontSize: 13, color: colors.textSecondary }}>
                  Lesser necesita "Acceso de uso" para medir tu tiempo de pantalla. Toca aquí para activarlo en Ajustes.
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* AI Motivational Reserved Space */}
        <View style={[styles.aiCard, { backgroundColor: colors.card, borderColor: aiMessage ? colors.accent + '30' : colors.border }]}>
          <View style={styles.aiHeader}>
            <View style={[styles.aiIconContainer, { backgroundColor: colors.accent + '20' }]}>
              <IconSymbol name="sparkles" size={14} color={colors.accent} />
            </View>
            <ThemedText style={[styles.aiTitle, { color: colors.accent }]}>Lesser AI Insight</ThemedText>
            {!aiMessage && <ActivityIndicator size="small" color={colors.accent} />}
          </View>
          {aiMessage ? (
            <ThemedText style={styles.aiContent}>{aiMessage}</ThemedText>
          ) : (
            <View style={styles.aiSkeletonContainer}>
              <View style={[styles.aiSkeleton, { width: '90%' }]} />
              <View style={[styles.aiSkeleton, { width: '40%' }]} />
            </View>
          )}
        </View>

        {/* Streak */}
        <StreakCounter days={streakDays} />

        {/* Usage hours — cycling taps, no navigation */}
        <UsageHoursCounter
          hours24h={usageHours24h}
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
            {t('home.timeSavedComparison', { what: getSavingsText(savedWeek) })}
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
  aiCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 12,
    borderStyle: 'dashed',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  aiContent: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  aiSkeletonContainer: {
    gap: 8,
  },
  aiSkeleton: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
  },
});