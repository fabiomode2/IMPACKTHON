import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { useSocial } from '@/hooks/useSocial';
import { Friend, getUserProfile } from '@/services/social';
import { fetchUsageStats, UsageStats } from '@/services/usage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BAR_MAX_HEIGHT = 100;
function getDays() {
  return [
    t('stats.days.mon').charAt(0),
    t('stats.days.tue').charAt(0),
    t('stats.days.wed').charAt(0),
    t('stats.days.thu').charAt(0),
    t('stats.days.fri').charAt(0),
    t('stats.days.sat').charAt(0),
    t('stats.days.sun').charAt(0),
  ];
}

export default function FriendProfileScreen() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const { user } = useAuth();
  const { following, follow, unfollow } = useSocial(user?.uid ?? null, user?.username ?? null);

  const [profile, setProfile] = useState<Friend | null>(null);
  const [friendStats, setFriendStats] = useState<UsageStats | null>(null);
  const [myStats, setMyStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isFollowing = useMemo(() => following.some(f => f.uid === uid), [following, uid]);

  useEffect(() => {
    if (!uid) return;

    async function loadData() {
      setLoading(true);
      try {
        const [profileData, statsData, myStatsData] = await Promise.all([
          getUserProfile(uid),
          fetchUsageStats(uid),
          user ? fetchUsageStats(user.uid) : Promise.resolve(null),
        ]);
        setProfile(profileData);
        setFriendStats(statsData);
        setMyStats(myStatsData);
      } catch (e) {
        console.error('Failed to load friend profile:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [uid, user]);

  const toggleFollow = async () => {
    if (!profile) return;
    if (isFollowing) {
      await unfollow(profile.uid);
    } else {
      await follow(profile.uid, profile.username);
    }
  };

  const handleShare = async () => {
    if (!profile) return;
    try {
      const profileLink = `https://lesser.app/profile/${profile.username}`;
      await Share.share({
        message: t('stats.shareMessageFriend', { username: profile.username, link: profileLink }),
        url: profileLink,
      });
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile || !friendStats) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText style={{ color: colors.textSecondary }}>{t('common.error')}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const friendAvg = friendStats.hours24h;
  const myAvg = myStats?.hours24h ?? 0;
  const isBetter = myAvg < friendAvg;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={22} color={colors.text} />
          <ThemedText style={{ fontWeight: '600' }}>{t('common.back')}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.card }]} onPress={handleShare}>
          <IconSymbol name="square.and.arrow.up" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>

        {/* Friend header */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.bigAvatar, { backgroundColor: colors.accent + '33' }]}>
            <ThemedText style={[styles.bigInitial, { color: colors.accent }]}>
              {profile.username.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText style={styles.profileName}>@{profile.username}</ThemedText>
          <ThemedText style={[styles.profileSub, { color: colors.textSecondary }]}>
            {t('friendProfile.streak', { days: profile.streakDays })} · {t('friendProfile.rank', { pct: friendStats.topPercentage })}
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.followBtn,
              isFollowing
                ? { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
                : { backgroundColor: colors.accent },
            ]}
            onPress={toggleFollow}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.followBtnText, { color: isFollowing ? colors.text : '#FFF' }]}>
              {isFollowing ? t('social.unfollow') : t('social.follow')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* VS card */}
        <View style={[styles.vsCard, { backgroundColor: isBetter ? colors.success + '22' : colors.error + '22', borderColor: isBetter ? colors.success : colors.error }]}>
          <ThemedText style={[styles.vsText, { color: isBetter ? colors.success : colors.error }]}>
            {isBetter
              ? t('friendProfile.youBetter', { diff: (friendAvg - myAvg).toFixed(1), name: profile.username })
              : t('friendProfile.theyBetter', { diff: (myAvg - friendAvg).toFixed(1), name: profile.username })}
          </ThemedText>
        </View>

        {/* Stats comparison table */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.chartTitle}>{t('friendProfile.headToHead')}</ThemedText>
          {[
            { label: t('friendProfile.avgDaily'), mine: `${myAvg.toFixed(1)}h`, theirs: `${friendAvg.toFixed(1)}h`, mineWins: myAvg < friendAvg },
            { label: t('friendProfile.streakLabel'), mine: t('home.streakDays', { count: myStats?.streakDays ?? 0 }), theirs: t('home.streakDays', { count: profile.streakDays }), mineWins: (myStats?.streakDays ?? 0) >= profile.streakDays },
            { label: t('friendProfile.rankLabel'), mine: t('friendProfile.topPercentage', { pct: myStats?.topPercentage ?? 50 }), theirs: t('friendProfile.topPercentage', { pct: friendStats.topPercentage }), mineWins: (myStats?.topPercentage ?? 50) <= friendStats.topPercentage },
          ].map((row, i) => (
            <View key={i} style={[styles.tableRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <ThemedText style={[styles.tableCell, { color: row.mineWins ? colors.success : colors.text, fontWeight: row.mineWins ? '700' : '400' }]}>{row.mine}</ThemedText>
              <ThemedText style={[styles.tableLabel, { color: colors.textSecondary }]}>{row.label}</ThemedText>
              <ThemedText style={[styles.tableCell, { color: !row.mineWins ? colors.success : colors.text, fontWeight: !row.mineWins ? '700' : '400', textAlign: 'right' }]}>{row.theirs}</ThemedText>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
    marginTop: 56,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { padding: 16, paddingTop: 4, gap: 16 },
  profileCard: {
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bigInitial: { fontSize: 36, fontWeight: '800' },
  profileName: { fontSize: 24, fontWeight: '700' },
  profileSub: { fontSize: 14, textAlign: 'center' },
  vsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  vsText: { fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  followBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  followBtnText: { fontSize: 14, fontWeight: '700' },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tableCell: { flex: 1, fontSize: 15 },
  tableLabel: { flex: 1, fontSize: 12, textAlign: 'center' },
});
