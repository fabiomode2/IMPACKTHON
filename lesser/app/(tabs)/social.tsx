import React, { useState } from 'react';
import {
  StyleSheet, SafeAreaView, View, TouchableOpacity, ScrollView,
  Modal, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FeedItem, FeedItemData } from '@/components/social/FeedItem';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Friend } from '@/services/social';
import { useAuth } from '@/hooks/useAuth';
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

export default function SocialScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { username } = useAuth();

  const [showCopied, setShowCopied] = useState(false);

  const handleShare = async () => {
    const handle = username ?? 'guest';
    const link = `lesser://profile/${handle}`;
    await Clipboard.setStringAsync(link);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2500);
  };

  const mockFeed: FeedItemData[] = [
    { id: '1', uid: 'u1', username: 'AlexRodriguez', days: 14, timestamp: '2h ago', message: '¡Poco a poco se nota la diferencia! Más concentración y mejor sueño.' },
    { id: '2', uid: 'u2', username: 'Maria_99', days: 3, timestamp: '5h ago', photoUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=600&auto=format&fit=crop' },
    { id: '3', uid: 'u3', username: 'Carlos_Dev', days: 30, timestamp: '1d ago', message: 'Un mes completo en Hardcore Mode. Al principio costó, pero merece la pena.' },
  ];

  const mockFriends: Friend[] = [
    { uid: 'u1', username: 'AlexRodriguez', streakDays: 14 },
    { uid: 'u2', username: 'Maria_99', streakDays: 3 },
    { uid: 'u3', username: 'Carlos_Dev', streakDays: 30 },
    { uid: 'u4', username: 'Sara_M', streakDays: 7 },
    { uid: 'u5', username: 'JuanP', streakDays: 2 },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">{t('social.title')}</ThemedText>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <IconSymbol name="square.and.arrow.up" size={16} color={colors.accent} />
            <ThemedText style={[styles.shareButtonText, { color: colors.accent }]}>
              {t('social.shareProfile')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Friends Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{t('social.friends')}</ThemedText>
            <TouchableOpacity onPress={() => router.push('/followers')}>
              <ThemedText style={[styles.seeAll, { color: colors.accent }]}>
                {t('social.followers')} →
              </ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendsRow}
          >
            {/* Add friend */}
            <TouchableOpacity
              style={[styles.addFriendCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/followers')}
            >
              <View style={[styles.addFriendIcon, { backgroundColor: colors.accent + '22' }]}>
                <IconSymbol name="plus" size={22} color={colors.accent} />
              </View>
              <ThemedText style={[styles.addFriendText, { color: colors.textSecondary }]}>
                {t('social.addFriend')}
              </ThemedText>
            </TouchableOpacity>
            {mockFriends.map(f => <FriendCard key={f.uid} friend={f} />)}
          </ScrollView>
        </View>

        {/* Feed */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('social.feed')}</ThemedText>
          <View>
            {mockFeed.map(item => <FeedItem key={item.id} data={item} />)}
          </View>
        </View>
      </ScrollView>

      {/* "Copied" toast */}
      <Modal visible={showCopied} transparent animationType="fade">
        <View style={styles.toastWrapper} pointerEvents="none">
          <View style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
            <ThemedText style={[styles.toastText, { color: colors.text }]}>
              {t('social.shareCopied')}
            </ThemedText>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    gap: 24,
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
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  shareButtonText: { fontSize: 13, fontWeight: '600' },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  seeAll: { fontSize: 13, fontWeight: '600' },
  friendsRow: { gap: 10 },
  friendCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    width: 80,
    gap: 6,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInitial: { fontSize: 20, fontWeight: '700' },
  friendName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  friendStreak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  friendStreakEmoji: { fontSize: 10 },
  friendStreakDays: { fontSize: 11 },
  addFriendCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    width: 80,
    gap: 6,
  },
  addFriendIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFriendText: { fontSize: 11, fontWeight: '600' },
  // Toast
  toastWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 120,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: { fontSize: 14, fontWeight: '600' },
});
