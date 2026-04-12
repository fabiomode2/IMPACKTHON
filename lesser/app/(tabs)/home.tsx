import { IconSymbol } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, AppState, NativeModules, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GithubCalendar } from '@/components/home/GithubCalendar';
import { MostUsedApps } from '@/components/home/MostUsedApps';
import { StreakCounter } from '@/components/home/StreakCounter';
import { TopUsersBadge } from '@/components/home/TopUsersBadge';
import { UsageHoursCounter } from '@/components/home/UsageHoursCounter';
import { ThemedText } from '@/components/themed-text';
import { useAppTimeTracker } from '@/hooks/useAppTimeTracker';
import { useUsageData } from '@/hooks/useUsageData';
import { generateMotivationalMessage } from '@/services/llm';
import { checkAndPostMilestones } from '@/services/social';
import { getDailyUsageStats, hasPermission, requestPermission } from '../../modules/expo-app-usage';

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

  const streakDays = stats?.streakDays ?? 0;
  const usageHoursWeek = stats?.hoursWeek ?? 0;
  const usageHoursMonth = stats?.hoursMonth ?? 0;
  const usageHours6Months = stats?.hours6Months ?? 0;
  const topPercentage = stats?.topPercentage ?? 50;

  const [hasUsagePerm, setHasUsagePerm] = React.useState(true);
  const [realUsageHours24h, setRealUsageHours24h] = React.useState(0);
  const [realMostUsedApps, setRealMostUsedApps] = React.useState<any[]>([]);

  useEffect(() => {
    const checkPerm = () => {
      try {
        const perm = hasPermission();
        setHasUsagePerm(perm);
        if (perm) {
          const usageStats = getDailyUsageStats();
          setRealUsageHours24h(usageStats.totalHours || 0);
          if (usageStats.apps && usageStats.apps.length > 0) {
            setRealMostUsedApps(usageStats.apps);
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

  const usageHours24h = realUsageHours24h > 0 ? realUsageHours24h : (stats?.hours24h ?? 0);

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

  const calendarData = stats?.calendarData || [];


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

        {/* Permission Banner */}
        {!hasUsagePerm && (
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
          hours24h={hasUsagePerm ? realUsageHours24h : usageHours24h}
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