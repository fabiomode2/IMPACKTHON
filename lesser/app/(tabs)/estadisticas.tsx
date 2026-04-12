import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, SafeAreaView, View, TouchableOpacity, ScrollView,
  Modal, Pressable, TextInput, ActivityIndicator, RefreshControl, Share, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FeedItem } from '@/components/social/FeedItem';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Friend, FeedPost, fetchFollowedFeed, searchUsers, getRecommendedUsers, AppNotification, onNotificationsChanged, markNotificationsAsRead } from '@/services/social';
import { useAuth } from '@/hooks/useAuth';
import { useSocial } from '@/hooks/useSocial';
import { UserDetailSheet } from '@/components/social/UserDetailSheet';
import { t } from '@/constants/i18n';

// --- Stats Components ---
import { GithubCalendar } from '@/components/home/GithubCalendar';
import { MostUsedApps } from '@/components/home/MostUsedApps';
import { StreakCounter } from '@/components/home/StreakCounter';
import { UsageHoursCounter } from '@/components/home/UsageHoursCounter';
import { TopUsersBadge } from '@/components/home/TopUsersBadge';
import { useUsageData } from '@/hooks/useUsageData';
import { formatLocalISO } from '@/services/usage';

const BAR_MAX_HEIGHT = 100;
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

function getChartData(dailyUsage: Record<string, { totalMinutes: number }>, period: ChartPeriod) {
  const now = new Date();
  const data: { label: string; hours: number }[] = [];

  switch (period) {
    case 'week': {
      const days = [t('stats.days.mon'), t('stats.days.tue'), t('stats.days.wed'), t('stats.days.thu'), t('stats.days.fri'), t('stats.days.sat'), t('stats.days.sun')];
      const currentDay = now.getDay();
      const daysSinceMon = currentDay === 0 ? 6 : currentDay - 1;
      const mon = new Date(now);
      mon.setDate(now.getDate() - daysSinceMon);

      for (let i = 0; i < 7; i++) {
        const d = new Date(mon);
        d.setDate(mon.getDate() + i);
        const dStr = formatLocalISO(d);
        data.push({
          label: days[i],
          hours: (dailyUsage[dStr]?.totalMinutes || 0) / 60
        });
      }
      break;
    }
    case 'month': {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const weeks: { mins: number; days: number }[] = [];
      let currentWeekMins = 0;
      let currentWeekDayCount = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dayOfWeek = date.getDay();
        const dStr = formatLocalISO(date);
        currentWeekMins += dailyUsage[dStr]?.totalMinutes || 0;
        currentWeekDayCount++;
        if (dayOfWeek === 0 || d === daysInMonth) {
          weeks.push({ mins: currentWeekMins, days: currentWeekDayCount });
          currentWeekMins = 0;
          currentWeekDayCount = 0;
        }
      }
      weeks.forEach((w, i) => {
        data.push({ label: `W${i + 1}`, hours: w.mins / (60 * w.days) });
      });
      break;
    }
    case '3months': {
      for (let m = 2; m >= 0; m--) {
        const target = new Date(now.getFullYear(), now.getMonth() - m, 1);
        let monthMins = 0;
        let daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const ds = formatLocalISO(new Date(target.getFullYear(), target.getMonth(), d));
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
          const ds = formatLocalISO(new Date(target.getFullYear(), target.getMonth(), d));
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
    <View style={styles.chartContainer}>
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

// ─── Share Profile Pop-up (from social.tsx) ─────────────────────────────────────────────────
function ShareProfileModal({ visible, onClose, username }: { visible: boolean; onClose: () => void; username: string; }) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [copied, setCopied] = useState(false);
  const profileLink = `https://lesser.app/profile/${username}`;
  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: `¡Únete a mi reto en Lesser! Sígueme para ver mi progreso reduciendo el tiempo de pantalla: ${profileLink}`,
        url: profileLink,
        title: 'Compartir Perfil de Lesser',
      });
      onClose();
    } catch (error) { console.error('Error sharing:', error); }
  };
  const handleCopy = async () => {
    await Clipboard.setStringAsync(profileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const initial = username.charAt(0).toUpperCase();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.card }]} onPress={e => e.stopPropagation()}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <View style={[styles.shareAvatar, { backgroundColor: colors.accent + '22' }]}>
            <ThemedText style={[styles.shareAvatarText, { color: colors.accent }]}>{initial}</ThemedText>
          </View>
          <ThemedText style={[styles.shareUsername, { color: colors.text }]}>@{username}</ThemedText>
          <ThemedText style={[styles.shareTitle, { color: colors.text }]}>Comparte tu progreso</ThemedText>
          <ThemedText style={[styles.shareSubtitle, { color: colors.textSecondary }]}>Invita a otros a seguir tu racha y motivarse juntos.</ThemedText>
          <TouchableOpacity style={[styles.copyBtn, { backgroundColor: colors.accent }]} onPress={handleNativeShare} activeOpacity={0.8}>
            <IconSymbol name="square.and.arrow.up" size={18} color="#FFF" />
            <ThemedText style={styles.copyBtnText}>Enviar por WhatsApp / Más</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkBox, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={handleCopy}>
            <IconSymbol name="doc.on.doc" size={16} color={colors.textSecondary} />
            <ThemedText style={[styles.linkText, { color: colors.textSecondary }]} numberOfLines={1}>{copied ? '¡Copiado!' : profileLink}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.closeBtn, { borderColor: colors.border }]} onPress={onClose} activeOpacity={0.7}>
            <ThemedText style={[styles.closeBtnText, { color: colors.textSecondary }]}>Cerrar</ThemedText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function EstadisticasScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // Data for Stats
  const { data: usageData, loading: usageLoading } = useUsageData(user?.uid);
  const streakDays = usageData?.streakDays ?? 0;
  const topPercentage = usageData?.topPercentage ?? 50;
  const dailyUsage = usageData?.rawUsage || {};
  const calendarData = usageData?.calendarData || [];
  
  const [periodIdx, setPeriodIdx] = useState(0);
  const period = PERIOD_CYCLE[periodIdx];
  const chartData = useMemo(() => getChartData(dailyUsage, period), [dailyUsage, period]);

  // Data for Social
  const { followers, following, isLoadingFollowers } = useSocial(user?.uid ?? null, user?.username ?? null);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ uid: string; username: string } | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [recommended, setRecommended] = useState<Friend[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onNotificationsChanged(user.uid, (notifs) => setNotifications(notifs));
    return () => unsub();
  }, [user]);

  const loadFeed = useCallback(async () => {
    if (!user) return;
    try {
      const posts = await fetchFollowedFeed(user.uid);
      if (posts.length === 0) {
        setFeed([{ id: 'mock1', uid: '123', username: 'alex_growth', type: 'STREAK', days: 12, timestamp: 'Hace 2 horas', message: 'Manteniendo el enfoque a tope.' }] as any);
      } else { setFeed(posts); }
    } catch (e) { console.error('Feed load failed:', e); }
  }, [user]);

  const loadRecommended = useCallback(async () => {
    try { const recs = await getRecommendedUsers(); setRecommended(recs); } catch (e) { console.error('Recommended load failed:', e); }
  }, []);

  useEffect(() => {
    loadFeed();
    loadRecommended();
  }, [loadFeed, loadRecommended]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        const results = await searchUsers(searchQuery);
        setSearchResults(results.filter(r => r.uid !== user?.uid));
        setIsSearching(false);
      }, 400);
      return () => clearTimeout(timer);
    } else { setSearchResults([]); setIsSearching(false); }
  }, [searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFeed();
    await loadRecommended();
    setIsRefreshing(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const openNotifications = async () => {
    setShowNotifications(true);
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0 && user) { await markNotificationsAsRead(user.uid, unreadIds); }
  };

  const displayUsername = user?.username ?? 'guest';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Estadísticas</ThemedText>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={openNotifications} style={styles.bellBtn}>
              <IconSymbol name="bell.fill" size={24} color={colors.text} />
              {unreadCount > 0 && (
                <View style={styles.badge}><ThemedText style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</ThemedText></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowShare(true)}>
              <IconSymbol name="person.badge.plus" size={16} color={colors.accent} />
              <ThemedText style={[styles.shareButtonText, { color: colors.accent }]}>Invitar</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. STREAK */}
        <StreakCounter days={streakDays} />

        {/* 2. USAGE HOURS COUNTER */}
        <UsageHoursCounter
          hours24h={usageData?.hours24h ?? 0}
          hoursWeek={usageData?.hoursWeek ?? 0}
          hoursMonth={usageData?.hoursMonth ?? 0}
          hours6Months={usageData?.hours6Months ?? 0}
        />

        {/* 3. CHARTS (from Stats screen) */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.statSection, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setPeriodIdx(i => (i + 1) % PERIOD_CYCLE.length)}
        >
          <View style={styles.chartHeader}>
            <ThemedText style={styles.chartTitle}>{periodLabel(period)}</ThemedText>
            <View style={[styles.cyclePill, { backgroundColor: colors.accent + '22' }]}>
              <ThemedText style={[styles.cycleText, { color: colors.accent }]}>{t('stats.tapToCycle')}</ThemedText>
            </View>
          </View>
          <BarChart data={chartData} />
        </TouchableOpacity>

        {/* 4. CALENDAR */}
        <View style={[styles.statSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <GithubCalendar data={calendarData} />
        </View>

        {/* 5. MOST USED APPS */}
        <MostUsedApps apps={usageData?.apps || []} />

        {/* 6. TOP USERS BADGE */}
        <TopUsersBadge percentage={topPercentage} />


        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* 7. SOCIAL FEATURES (Below Stats) */}
        <View style={styles.socialHeader}>
          <ThemedText style={styles.sectionTitle}>Comunidad</ThemedText>
        </View>

        <View style={styles.statsOverview}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push({ pathname: '/followers', params: { tab: 'followers' } })}>
            <ThemedText style={[styles.statNumber, { color: colors.success }]}>{followers.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Seguidores</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push({ pathname: '/followers', params: { tab: 'following' } })}>
            <ThemedText style={[styles.statNumber, { color: colors.accent }]}>{following.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Siguiendo</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={18} color={colors.textSecondary} />
          <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="Buscar amigos..." placeholderTextColor={colors.textSecondary} value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" />
          {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><IconSymbol name="xmark.circle.fill" size={18} color={colors.textSecondary} /></TouchableOpacity>}
        </View>

        {searchQuery.length > 0 ? (
          <View style={styles.resultsContainer}>
            {isSearching ? <ActivityIndicator color={colors.accent} /> : searchResults.length === 0 ? <ThemedText>No hay resultados</ThemedText> : (
              <View style={styles.resultsList}>
                {searchResults.map(f => (
                  <TouchableOpacity key={f.uid} style={[styles.resultItem, { borderBottomColor: colors.border }]} onPress={() => { setSelectedUser({ uid: f.uid, username: f.username }); setShowSheet(true); }}>
                    <View style={[styles.friendAvatarSmall, { backgroundColor: colors.accent + '22' }]}><ThemedText style={{ color: colors.accent }}>{f.username[0].toUpperCase()}</ThemedText></View>
                    <ThemedText style={{ flex: 1 }}>@{f.username}</ThemedText>
                    <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Logros de amigos</ThemedText>
            {feed.length === 0 ? <ThemedText style={{ textAlign: 'center', opacity: 0.5 }}>No hay actividad reciente.</ThemedText> : (
              <View style={{ gap: 12 }}>{feed.map(item => <FeedItem key={item.id} data={item as any} />)}</View>
            )}
          </View>
        )}
      </ScrollView>

      <ShareProfileModal visible={showShare} onClose={() => setShowShare(false)} username={displayUsername} />
      <UserDetailSheet visible={showSheet} onClose={() => setShowSheet(false)} userUid={selectedUser?.uid ?? null} username={selectedUser?.username ?? null} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  shareButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, borderWidth: 1 },
  shareButtonText: { fontSize: 13, fontWeight: '700' },
  statSection: { padding: 20, borderRadius: 20, borderWidth: 1 },
  chartContainer: { marginTop: 10 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  chartTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', opacity: 0.7 },
  cyclePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  cycleText: { fontSize: 10, fontWeight: '700' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: BAR_MAX_HEIGHT + 30 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, fontWeight: '600' },
  bar: { width: '60%', borderRadius: 4 },
  barLabel: { fontSize: 10 },
  goalLine: { marginTop: 8, borderTopWidth: 1, borderStyle: 'dashed', paddingTop: 4, alignItems: 'flex-end' },
  goalLineLabel: { fontSize: 10, fontWeight: '600' },
  divider: { height: 1, marginVertical: 10 },
  socialHeader: { marginTop: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', opacity: 0.5, letterSpacing: 1 },
  statsOverview: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  resultsContainer: { minHeight: 100 },
  resultsList: { borderRadius: 12, overflow: 'hidden' },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  friendAvatarSmall: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  section: { gap: 12 },
  bellBtn: { position: 'relative', padding: 4 },
  badge: { position: 'absolute', top: -2, right: -4, backgroundColor: 'red', borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFF' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, alignItems: 'center', gap: 16 },
  modalHandle: { width: 36, height: 5, borderRadius: 2.5, marginBottom: 8 },
  shareAvatar: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  shareAvatarText: { fontSize: 30, fontWeight: '800' },
  shareUsername: { fontSize: 16, fontWeight: '700' },
  shareTitle: { fontSize: 20, fontWeight: '800' },
  shareSubtitle: { fontSize: 14, textAlign: 'center', opacity: 0.7 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, alignSelf: 'stretch', justifyContent: 'center' },
  copyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  linkBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, alignSelf: 'stretch' },
  linkText: { flex: 1, fontSize: 12 },
  closeBtn: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignSelf: 'stretch', alignItems: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '700' },
});
