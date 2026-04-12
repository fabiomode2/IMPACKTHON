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


  // Compact Progress Component
  const progress = Math.min(1, usageHours24h / goalHours);
  const isOverGoal = usageHours24h > goalHours;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
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
        </View>

        {/* AI Motivational Reserved Space */}
        <View style={[styles.aiCard, { backgroundColor: colors.card, borderColor: aiMessage ? colors.accent + '30' : colors.border }]}>
          <View style={styles.aiHeader}>
            <View style={[styles.aiIconContainer, { backgroundColor: colors.accent + '22' }]}>
              <IconSymbol name="sparkles" size={14} color={colors.accent} />
            </View>
            <ThemedText style={[styles.aiTitle, { color: colors.accent }]}>Lesser AI Insight</ThemedText>
            {!aiMessage && <ActivityIndicator size="small" color={colors.accent} />}
          </View>
          {aiMessage ? (
            <ThemedText style={styles.aiContent} numberOfLines={4}>{aiMessage}</ThemedText>
          ) : (
            <View style={styles.aiSkeletonContainer}>
              <View style={[styles.aiSkeleton, { width: '90%' }]} />
              <View style={[styles.aiSkeleton, { width: '40%' }]} />
            </View>
          )}
        </View>

        {/* Compact Daily Progress */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.progressTitle}>Uso de Hoy</ThemedText>
          <View style={styles.progressMain}>
            <ThemedText style={[styles.progressValue, { color: isOverGoal ? colors.error : colors.text }]}>
              {usageHours24h.toFixed(1)}h
            </ThemedText>
            <ThemedText style={[styles.progressGoal, { color: colors.textSecondary }]}>
              / {goalHours}h meta
            </ThemedText>
          </View>
          
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { 
              width: `${progress * 100}%`, 
              backgroundColor: isOverGoal ? colors.error : colors.accent 
            }]} />
          </View>
          
          <ThemedText style={[styles.progressStatus, { color: isOverGoal ? colors.error : colors.success }]}>
            {isOverGoal ? '¡Te has pasado de la meta!' : 'Vas por buen camino'}
          </ThemedText>
        </View>

        {/* Shortcut to Stats Tab */}
        <TouchableOpacity
          style={[styles.bigStatsBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/(tabs)/estadisticas')}
        >
          <IconSymbol name="chart.bar.fill" size={20} color="#FFF" />
          <ThemedText style={styles.bigStatsBtnText}>Ver estadísticas detalladas</ThemedText>
          <IconSymbol name="chevron.right" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Live Active Timer (Small & Fixed) */}
        <View style={styles.timerMini}>
          <IconSymbol name="timer" size={14} color={colors.textSecondary} />
          <ThemedText style={styles.timerMiniText}>
            Tiempo activo: <ThemedText style={{fontWeight: '700', color: colors.text}}>{formattedTime}</ThemedText>
          </ThemedText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    gap: 20,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  greeting: { fontSize: 16 },
  name: { fontSize: 32, fontWeight: '800' },
  aiCard: {
    padding: 24,
    borderRadius: 28,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  aiContent: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  aiSkeletonContainer: { gap: 8 },
  aiSkeleton: { height: 14, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 7 },
  
  progressCard: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    gap: 16,
  },
  progressTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', opacity: 0.6, letterSpacing: 1 },
  progressMain: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  progressValue: { fontSize: 48, fontWeight: '900' },
  progressGoal: { fontSize: 18, fontWeight: '600' },
  progressBarBg: { height: 12, borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
  progressStatus: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  
  bigStatsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  bigStatsBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  
  timerMini: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 'auto',
  },
  timerMiniText: { fontSize: 13, color: 'rgba(0,0,0,0.5)' },
});
});