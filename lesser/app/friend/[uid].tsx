import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_MAX_HEIGHT = 100;

// Simulated friend data — replace with fetchFriendProfile(uid) from social service
const FRIEND_DATA: Record<string, { username: string; streakDays: number; topPercent: number; weeklyHours: number[] }> = {
  u1: { username: 'AlexRodriguez', streakDays: 14, topPercent: 22, weeklyHours: [3.2, 4.1, 2.8, 5.0, 3.5, 4.8, 2.1] },
  u2: { username: 'Maria_99', streakDays: 3, topPercent: 45, weeklyHours: [5.5, 6.2, 4.8, 7.1, 5.2, 6.0, 4.5] },
  u3: { username: 'Carlos_Dev', streakDays: 30, topPercent: 5, weeklyHours: [1.5, 2.0, 1.8, 2.5, 1.2, 1.9, 1.0] },
  u4: { username: 'Sara_M', streakDays: 7, topPercent: 31, weeklyHours: [3.8, 3.5, 4.2, 3.9, 3.1, 4.5, 2.8] },
  u5: { username: 'JuanP', streakDays: 2, topPercent: 60, weeklyHours: [6.0, 5.8, 7.2, 6.5, 5.9, 7.0, 5.5] },
};

const MY_WEEKLY_HOURS = [4.2, 3.1, 5.5, 2.8, 3.9, 6.1, 1.5];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const GOAL = 4;

export default function FriendProfileScreen() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [isFollowing, setIsFollowing] = useState(true); // Mock: default to following


  const friend = uid ? FRIEND_DATA[uid] : null;

  if (!friend) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText style={{ color: colors.textSecondary }}>Profile not found</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const maxHours = Math.max(...friend.weeklyHours, ...MY_WEEKLY_HOURS);

  const friendAvg = friend.weeklyHours.reduce((a, b) => a + b, 0) / 7;
  const myAvg = MY_WEEKLY_HOURS.reduce((a, b) => a + b, 0) / 7;
  const isBetter = myAvg < friendAvg;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
        <IconSymbol name="chevron.left" size={22} color={colors.text} />
        <ThemedText style={{ fontWeight: '600' }}>Profile</ThemedText>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>

        {/* Friend header */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.bigAvatar, { backgroundColor: colors.accent + '33' }]}>
            <ThemedText style={[styles.bigInitial, { color: colors.accent }]}>
              {friend.username.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText style={styles.profileName}>{friend.username}</ThemedText>
          <ThemedText style={[styles.profileSub, { color: colors.textSecondary }]}>
            🔥 {friend.streakDays} day streak · Top {friend.topPercent}% of users
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.followBtn,
              isFollowing
                ? { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
                : { backgroundColor: colors.accent },
            ]}
            onPress={() => setIsFollowing(f => !f)}
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
              ? `You use ${(friendAvg - myAvg).toFixed(1)}h less per day than ${friend.username} 🏆`
              : `${friend.username} uses ${(myAvg - friendAvg).toFixed(1)}h less per day than you 💪`}
          </ThemedText>
        </View>

        {/* Comparison chart */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.chartTitle}>7-Day Comparison</ThemedText>
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>You</ThemedText>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>{friend.username}</ThemedText>
            </View>
          </View>
          <View style={styles.bars}>
            {DAYS.map((day, i) => {
              const myH = MY_WEEKLY_HOURS[i] / maxHours * BAR_MAX_HEIGHT;
              const frH = friend.weeklyHours[i] / maxHours * BAR_MAX_HEIGHT;
              return (
                <View key={i} style={styles.barGroup}>
                  <View style={styles.barPair}>
                    <View style={[styles.bar, { height: myH, backgroundColor: colors.accent + 'CC' }]} />
                    <View style={[styles.bar, { height: frH, backgroundColor: '#FF9500CC' }]} />
                  </View>
                  <ThemedText style={[styles.barLabel, { color: colors.textSecondary }]}>{day}</ThemedText>
                </View>
              );
            })}
          </View>
        </View>

        {/* Stats comparison table */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.chartTitle}>Head to Head</ThemedText>
          {[
            { label: 'Avg daily usage', mine: `${myAvg.toFixed(1)}h`, theirs: `${friendAvg.toFixed(1)}h`, mineWins: myAvg < friendAvg },
            { label: 'Streak', mine: '15 days', theirs: `${friend.streakDays} days`, mineWins: 15 >= friend.streakDays },
            { label: 'Ranking', mine: 'Top 15%', theirs: `Top ${friend.topPercent}%`, mineWins: 15 <= friend.topPercent },
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    margin: 16,
    marginTop: 56,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
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
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13 },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT + 24,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 10,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: { fontSize: 10 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tableCell: { flex: 1, fontSize: 15 },
  tableLabel: { flex: 1, fontSize: 12, textAlign: 'center' },
});
