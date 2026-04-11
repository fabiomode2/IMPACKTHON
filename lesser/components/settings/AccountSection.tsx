import React from 'react';
import {
  View, StyleSheet, TouchableOpacity,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { t } from '@/constants/i18n';

export function AccountSection() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { username, isLoggedIn, logout, mode } = useAuth();
  const router = useRouter();

  const displayUsername = username || 'Guest';

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  const handleDeleteAccountNav = () => {
    router.push('/delete-account');
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>{t('settings.account')}</ThemedText>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
            <ThemedText style={{ color: colors.background, fontSize: 24, fontWeight: 'bold' }}>
              {displayUsername.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.userInfo}>
            <ThemedText style={styles.name}>@{displayUsername}</ThemedText>
            <ThemedText style={[styles.subText, { color: colors.textSecondary }]}>
              {isLoggedIn ? t('settings.memberSince') : t('settings.guestLabel')}
            </ThemedText>
          </View>
          <View style={[styles.modePill, { backgroundColor: colors.accent + '22' }]}>
            <ThemedText style={[styles.modeText, { color: colors.accent }]}>
              {mode === 'soft' ? '🌿' : mode === 'mid' ? '🛡️' : '🔥'} {mode}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {isLoggedIn ? (
          <>
            <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
              <IconSymbol name="arrow.right.square" size={20} color={colors.error} />
              <ThemedText style={[styles.actionText, { color: colors.error }]}>{t('settings.logOut')}</ThemedText>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccountNav}>
              <IconSymbol name="trash.fill" size={20} color={colors.error} />
              <ThemedText style={[styles.actionText, { color: colors.error }]}>
                {t('settings.deleteAccount')}
              </ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.actionRow} onPress={() => router.replace('/auth')}>
            <IconSymbol name="person.fill" size={20} color={colors.accent} />
            <ThemedText style={[styles.actionText, { color: colors.accent }]}>{t('settings.logIn')}</ThemedText>
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  userInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '600' },
  subText: { fontSize: 13, marginTop: 2 },
  modePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  modeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  actionText: { fontSize: 16, flex: 1 },
});
