import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, StyleSheet, FlatList, SafeAreaView,
  TouchableOpacity, TextInput, Animated, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useSocial } from '@/hooks/useSocial';
import { searchUsers, Friend } from '@/services/social';

interface UserRow {
  uid: string;
  username: string;
  streakDays: number;
  isFollowing: boolean;
}

export default function FollowersScreen() {
  const params = useLocalSearchParams<{ tab?: 'followers' | 'following' }>();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(params.tab || 'followers');

  const { user } = useAuth();
  const myUid = user?.uid ?? null;
  const myUsername = user?.username ?? null;

  const { followers, following, isLoadingFollowers, follow, unfollow } = useSocial(myUid, myUsername);

  // Handle live search
  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(search);
        // Don't show myself in search results
        setSearchResults(results.filter(r => r.uid !== myUid));
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, myUid]);

  // Combined list logic
  // If searching: show search results
  // If not searching: show followers or following based on Active Tab
  const displayUsers = useMemo(() => {
    const followingSet = new Set(following.map(f => f.uid));
    let sourceList = followers;
    
    if (search.length >= 2) {
        sourceList = searchResults;
    } else {
        sourceList = activeTab === 'followers' ? followers : following;
    }
    
    return sourceList.map(item => ({
      uid: item.uid,
      username: item.username,
      streakDays: item.streakDays,
      isFollowing: followingSet.has(item.uid),
    }));
  }, [search, searchResults, followers, following, activeTab]);

  const toggleFollow = async (uid: string, username: string, currentlyFollowing: boolean) => {
    if (currentlyFollowing) {
      await unfollow(uid);
    } else {
      await follow(uid, username);
    }
  };

  const renderItem = ({ item }: { item: UserRow }) => (
    <FollowerRow
      item={item}
      colors={colors}
      onPress={() => router.push(`/friend/${item.uid}`)}
      onToggleFollow={() => toggleFollow(item.uid, item.username, item.isFollowing)}
    />
  );

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

      {/* Pestañas (Tabs) */}
      <View style={styles.tabContainer}>
          <TouchableOpacity 
             style={[styles.tabBtn, activeTab === 'followers' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]} 
             onPress={() => { setActiveTab('followers'); setSearch(''); }}
          >
              <ThemedText style={{ fontWeight: activeTab === 'followers' ? 'bold' : 'normal', color: activeTab === 'followers' ? colors.accent : colors.textSecondary }}>Seguidores ({followers.length})</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
             style={[styles.tabBtn, activeTab === 'following' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]} 
             onPress={() => { setActiveTab('following'); setSearch(''); }}
          >
              <ThemedText style={{ fontWeight: activeTab === 'following' ? 'bold' : 'normal', color: activeTab === 'following' ? colors.accent : colors.textSecondary }}>Siguiendo ({following.length})</ThemedText>
          </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar amigos..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {(search.length > 0 || isSearching) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isSearching && <ActivityIndicator size="small" color={colors.accent} />}
            <TouchableOpacity onPress={() => setSearch('')}>
              <IconSymbol name="xmark.circle.fill" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Count pill / Section Label */}
      <View style={styles.countRow}>
        <ThemedText style={[styles.countText, { color: colors.textSecondary }]}>
          {search.length >= 2 
             ? `${displayUsers.length} resultados encontrados`
             : activeTab === 'followers' 
                 ? `Tienes ${followers.length} seguidores`
                 : `Estas siguiendo a ${following.length} usuarios`
          }
        </ThemedText>
      </View>

      {isLoadingFollowers && search.length < 2 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={displayUsers}
          keyExtractor={item => item.uid}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
                <IconSymbol name="person.2.slash" size={32} color={colors.textSecondary + '60'} />
              </View>
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                {search.length >= 2 
                  ? isSearching ? 'Buscando...' : 'No se encontraron usuarios.'
                  : activeTab === 'followers' ? 'Aún no tienes seguidores.' : 'No sigues a nadie todavía.'}
              </ThemedText>
            </View>
          }
        />
      )}
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
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 8 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { paddingTop: 100, alignItems: 'center', gap: 16 },
  emptyIconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '500', textAlign: 'center', maxWidth: '80%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: { fontSize: 22, fontWeight: '800' },
  username: { fontSize: 16, fontWeight: '700' },
  streak: { fontSize: 13, marginTop: 2 },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  followBtnText: { fontSize: 14, fontWeight: '700' },
});
