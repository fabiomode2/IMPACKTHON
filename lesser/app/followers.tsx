import React, { useState, useRef } from 'react';
import {
  View, StyleSheet, FlatList, SafeAreaView,
  TouchableOpacity, TextInput, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';

interface UserRow {
  uid: string;
  username: string;
  streakDays: number;
  isFollowing: boolean;
}

// Mock data — replace with fetchFollowers(uid) + fetchFollowing(uid) from social service
const MOCK_FOLLOWERS: UserRow[] = [
  { uid: 'u1', username: 'AlexRodriguez', streakDays: 14, isFollowing: true },
  { uid: 'u2', username: 'Maria_99', streakDays: 3, isFollowing: true },
  { uid: 'u3', username: 'Carlos_Dev', streakDays: 30, isFollowing: false },
  { uid: 'u4', username: 'Sara_M', streakDays: 7, isFollowing: true },
  { uid: 'u5', username: 'JuanP', streakDays: 2, isFollowing: false },
  { uid: 'u6', username: 'Lucia_F', streakDays: 18, isFollowing: false },
  { uid: 'u7', username: 'Pablo_S', streakDays: 5, isFollowing: true },
];

export default function FollowersScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<UserRow[]>(MOCK_FOLLOWERS);
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFollow = (uid: string) => {
    // [FIREBASE] followUser(uid) / unfollowUser(uid)
    setUsers(prev =>
      prev.map(u => u.uid === uid ? { ...u, isFollowing: !u.isFollowing } : u)
    );
  };

  const renderItem = ({ item }: { item: UserRow }) => (
    <FollowerRow
      item={item}
      colors={colors}
      onPress={() => router.push(`/friend/${item.uid}`)}
      onToggleFollow={() => toggleFollow(item.uid)}
    />
  );

  const followingCount = filtered.filter(u => u.isFollowing).length;
  const noun = filtered.length === 1
    ? t('followers.followerSingular')
    : t('followers.followerPlural');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={22} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>{t('followers.title')}</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('followers.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <IconSymbol name="xmark.circle.fill" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Count pill */}
      <View style={styles.countRow}>
        <ThemedText style={[styles.countText, { color: colors.textSecondary }]}>
          {t('followers.countSummary', {
            count: filtered.length,
            noun,
            following: followingCount,
          })}
        </ThemedText>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.uid}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─── Row component with animated follow button ────────────────────────────────
type AnyColors = { accent: string; card: string; border: string; text: string; textSecondary: string; [key: string]: string };

function FollowerRow({
  item, colors, onPress, onToggleFollow,
}: {
  item: UserRow;
  colors: AnyColors;
  onPress: () => void;
  onToggleFollow: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleFollowPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onToggleFollow();
  };

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.profile}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: colors.accent + '33' }]}>
          <ThemedText style={[styles.initial, { color: colors.accent }]}>
            {item.username.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View>
          <ThemedText style={styles.username}>{item.username}</ThemedText>
          <ThemedText style={[styles.streak, { color: colors.textSecondary }]}>
            {t('followers.streakLabel', { days: item.streakDays })}
          </ThemedText>
        </View>
      </TouchableOpacity>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.followBtn,
            item.isFollowing
              ? { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
              : { backgroundColor: colors.accent },
          ]}
          onPress={handleFollowPress}
          activeOpacity={0.8}
        >
          <ThemedText
            style={[
              styles.followBtnText,
              { color: item.isFollowing ? colors.text : '#FFF' },
            ]}
          >
            {item.isFollowing ? t('social.unfollow') : t('social.follow')}
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  countRow: { paddingHorizontal: 20, paddingBottom: 8 },
  countText: { fontSize: 13 },
  list: { paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: { fontSize: 20, fontWeight: '700' },
  username: { fontSize: 15, fontWeight: '600' },
  streak: { fontSize: 12, marginTop: 2 },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  followBtnText: { fontSize: 13, fontWeight: '700' },
});
