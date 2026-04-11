import React, { useState, useEffect, useCallback } from 'react';
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

// ─── Friend Card ─────────────────────────────────────────────────────────
function FriendCard({ friend }: { friend: Friend }) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/friend/${friend.uid}`)}
      activeOpacity={0.75}
    >
      <View style={[styles.friendAvatar, { backgroundColor: colors.accent + '33' }]}>
        <ThemedText style={[styles.friendInitial, { color: colors.accent }]}>
          {friend.username.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <ThemedText style={styles.friendName} numberOfLines={1}>{friend.username}</ThemedText>
      <View style={styles.friendStreak}>
        <ThemedText style={styles.friendStreakEmoji}>🔥</ThemedText>
        <ThemedText style={[styles.friendStreakDays, { color: colors.textSecondary }]}>
          {friend.streakDays}d
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

// ─── Share Profile Pop-up ─────────────────────────────────────────────────
function ShareProfileModal({
  visible,
  onClose,
  username,
}: {
  visible: boolean;
  onClose: () => void;
  username: string;
}) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [copied, setCopied] = useState(false);

  const profileLink = `https://lesser.app/profile/${username}`;

  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: `¡Únete a mi reto en Lesser! Sígueme para ver mi progreso reduciendo el tiempo de pantalla: ${profileLink}`,
        url: profileLink, // iOS only
        title: 'Compartir Perfil de Lesser',
      });
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(profileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const initial = username.charAt(0).toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalSheet, { backgroundColor: colors.card }]}
          onPress={e => e.stopPropagation()}
        >
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <View style={[styles.shareAvatar, { backgroundColor: colors.accent + '22' }]}>
            <ThemedText style={[styles.shareAvatarText, { color: colors.accent }]}>
              {initial}
            </ThemedText>
          </View>
          <ThemedText style={[styles.shareUsername, { color: colors.text }]}>
            @{username}
          </ThemedText>
          <ThemedText style={[styles.shareTitle, { color: colors.text }]}>
            Comparte tu progreso
          </ThemedText>
          <ThemedText style={[styles.shareSubtitle, { color: colors.textSecondary }]}>
            Invita a otros a seguir tu racha y motivarse juntos.
          </ThemedText>

          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: colors.accent }]}
            onPress={handleNativeShare}
            activeOpacity={0.8}
          >
            <IconSymbol name="square.and.arrow.up" size={18} color="#FFF" />
            <ThemedText style={styles.copyBtnText}>Enviar por WhatsApp / Más</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkBox, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={handleCopy}
          >
            <IconSymbol name="doc.on.doc" size={16} color={colors.textSecondary} />
            <ThemedText
              style={[styles.linkText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {copied ? '¡Copiado!' : profileLink}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.closeBtn, { borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.closeBtnText, { color: colors.textSecondary }]}>
              Cerrar
            </ThemedText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function SocialScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { following, follow, unfollow, isLoadingFollowers } = useSocial(user?.uid ?? null, user?.username ?? null);

  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Sheet state
  const [selectedUser, setSelectedUser] = useState<{ uid: string; username: string } | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [recommended, setRecommended] = useState<Friend[]>([]);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onNotificationsChanged(user.uid, (notifs) => {
      setNotifications(notifs);
    });
    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const openNotifications = async () => {
    setShowNotifications(true);
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0 && user) {
        await markNotificationsAsRead(user.uid, unreadIds);
    }
  };

  const loadFeed = useCallback(async () => {
    if (!user) return;
    try {
      const posts = await fetchFollowedFeed(user.uid);
      if (posts.length === 0) {
        // Mock posts for demonstration
        setFeed([
          {
            id: 'mock1',
            uid: '123',
            username: 'alex_growth',
            type: 'STREAK',
            days: 12,
            timestamp: 'Hace 2 horas',
            message: 'Manteniendo el enfoque a tope.'
          },
          {
            id: 'mock2',
            uid: '456',
            username: 'maria_less',
            type: 'USAGE_REDUCTION',
            value: 40,
            days: 0,
            timestamp: 'Hace 5 horas',
            subtext: 'Ganando tiempo real.'
          }
        ] as any);
      } else {
        setFeed(posts);
      }
    } catch (e) {
      console.error('Feed load failed:', e);
    }
  }, [user]);

  const loadRecommended = useCallback(async () => {
    try {
      const recs = await getRecommendedUsers();
      setRecommended(recs);
    } catch (e) {
      console.error('Recommended load failed:', e);
    }
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
        setSearchResults(results);
        setIsSearching(false);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFeed();
    await loadRecommended();
    setIsRefreshing(false);
  };

  const displayUsername = user?.username ?? 'guest';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Comunidad</ThemedText>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={openNotifications} style={styles.bellBtn}>
                <IconSymbol name="bell.fill" size={24} color={colors.text} />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <ThemedText style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</ThemedText>
                    </View>
                )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowShare(true)}
              activeOpacity={0.7}
            >
              <IconSymbol name="person.badge.plus" size={16} color={colors.accent} />
              <ThemedText style={[styles.shareButtonText, { color: colors.accent }]}>
                Invitar
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.statsOverview}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/followers')}
          >
            <ThemedText style={[styles.statNumber, { color: colors.accent }]}>{following.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Siguiendo</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/followers')}
          >
            <ThemedText style={[styles.statNumber, { color: colors.success }]}>{followers.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Seguidores</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar amigos por nombre..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results / Recommended */}
        {searchQuery.length > 0 ? (
          <View style={styles.resultsContainer}>
            <ThemedText style={styles.sectionTitle}>Resultados</ThemedText>
            {isSearching ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
            ) : searchResults.length === 0 ? (
              <ThemedText style={{ color: colors.textSecondary, marginTop: 10 }}>No se encontraron usuarios.</ThemedText>
            ) : (
              <View style={styles.resultsList}>
                {searchResults.map(f => {
                  return (
                    <TouchableOpacity
                      key={f.uid}
                      style={[styles.resultItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                          setSelectedUser({ uid: f.uid, username: f.username });
                          setShowSheet(true);
                      }}
                    >
                      <View style={[styles.friendAvatarSmall, { backgroundColor: colors.accent + '22' }]}>
                        <ThemedText style={{ color: colors.accent, fontWeight: '700' }}>{f.username[0].toUpperCase()}</ThemedText>
                      </View>
                      <ThemedText style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>
                        @{f.username}
                      </ThemedText>
                      <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Friends Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Siguiendo</ThemedText>
                <ThemedText style={[styles.countBadge, { backgroundColor: colors.accent + '22', color: colors.accent }]}>
                  {following.length}
                </ThemedText>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.friendsRow}
              >
                {isLoadingFollowers ? (
                  <View style={{ width: 80, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={colors.accent} />
                  </View>
                ) : following.length === 0 ? (
                  <View style={styles.emptyFriends}>
                    <ThemedText style={[styles.emptyFriendsText, { color: colors.textSecondary }]}>
                      No sigues a nadie aún.
                    </ThemedText>
                  </View>
                ) : (
                  following.map(f => <FriendCard key={f.uid} friend={f} />)
                )}
              </ScrollView>
            </View>

            {/* Recommended Users (Discovery) */}
            {recommended.length > 0 && (
                 <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Recomendados</ThemedText>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.friendsRow}
                    >
                        {recommended.map(f => (
                            <FriendCard key={f.uid} friend={f} />
                        ))}
                    </ScrollView>
                 </View>
            )}

            {/* Feed */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Logros de amigos</ThemedText>
              {feed.length === 0 ? (
                <View style={styles.emptyFeed}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
                    <IconSymbol name="star.fill" size={32} color={colors.textSecondary + '66'} />
                  </View>
                  <ThemedText style={{ color: colors.textSecondary, marginTop: 16, textAlign: 'center', maxWidth: 200 }}>
                    Sigue a tus amigos para ver sus logros diarios aquí.
                  </ThemedText>
                </View>
              ) : (
                <View style={{ gap: 12, marginTop: 4 }}>
                  {feed.map(item => <FeedItem key={item.id} data={item as any} />)}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <ShareProfileModal
        visible={showShare}
        onClose={() => setShowShare(false)}
        username={displayUsername}
      />

      <UserDetailSheet 
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        userUid={selectedUser?.uid ?? null}
        username={selectedUser?.username ?? null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    gap: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
  },
  shareButtonText: { fontSize: 13, fontWeight: '700' },
  statsOverview: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  resultsContainer: {
    gap: 12,
    minHeight: 200,
  },
  resultsList: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  friendAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: { gap: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
  },
  countBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  friendsRow: { gap: 12 },
  friendCard: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    width: 90,
    gap: 8,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInitial: { fontSize: 22, fontWeight: '800' },
  friendName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  friendStreak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  friendStreakEmoji: { fontSize: 10 },
  friendStreakDays: { fontSize: 12, fontWeight: '600' },
  emptyFriends: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  emptyFriendsText: { fontSize: 14, fontStyle: 'italic' },
  emptyFeed: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Share Modal Styles ─────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    paddingTop: 12,
    alignItems: 'center',
    gap: 16,
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00000020',
    marginBottom: 8,
  },
  shareAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  shareAvatarText: { fontSize: 36, fontWeight: '800' },
  shareUsername: { fontSize: 18, fontWeight: '700' },
  shareTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  shareSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, opacity: 0.7 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  copyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'stretch',
  },
  linkText: { flex: 1, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  followBtnSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 85,
  },
  closeBtn: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 15, fontWeight: '700' },
  bellBtn: { position: 'relative', padding: 4 },
  badge: {
     position: 'absolute',
     top: -2,
     right: -4,
     backgroundColor: 'red',
     borderRadius: 10,
     minWidth: 18,
     height: 18,
     justifyContent: 'center',
     alignItems: 'center',
     paddingHorizontal: 4,
     borderWidth: 1.5,
     borderColor: '#FFF',
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, minHeight: '50%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#333' },
  notifItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  notifIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
});

