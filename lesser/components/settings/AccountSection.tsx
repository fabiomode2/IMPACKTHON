import React, { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity,
  Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { t } from '@/constants/i18n';
import { deleteAccount } from '@/services/auth';

export function AccountSection() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { username, isLoggedIn, logout, mode } = useAuth();
  const router = useRouter();

  const displayUsername = username || 'Guest';

  // ─── Delete Account state ────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword]   = useState('');
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [deleteError, setDeleteError]         = useState('');

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  const openDeleteModal = () => {
    setDeletePassword('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError(t('settings.passwordRequired'));
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');

    const result = await deleteAccount(deletePassword);

    setDeleteLoading(false);

    if (result.success) {
      setShowDeleteModal(false);
      router.replace('/auth');
    } else {
      setDeleteError(result.error ?? t('settings.deleteAccountError'));
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      t('settings.deleteAccountTitle'),
      t('settings.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccountAction'),
          style: 'destructive',
          onPress: openDeleteModal,
        },
      ]
    );
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
            <ThemedText style={styles.name}>{displayUsername}</ThemedText>
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

        {isLoggedIn && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.actionRow}>
              <IconSymbol name="pencil" size={20} color={colors.icon} />
              <ThemedText style={styles.actionText}>{t('settings.changeUsername')}</ThemedText>
              <IconSymbol name="chevron.right" size={18} color={colors.icon} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.actionRow}>
              <IconSymbol name="key.fill" size={20} color={colors.icon} />
              <ThemedText style={styles.actionText}>{t('settings.changePassword')}</ThemedText>
              <IconSymbol name="chevron.right" size={18} color={colors.icon} />
            </TouchableOpacity>
          </>
        )}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {isLoggedIn ? (
          <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
            <IconSymbol name="arrow.right.square" size={20} color={colors.error} />
            <ThemedText style={[styles.actionText, { color: colors.error }]}>{t('settings.logOut')}</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionRow} onPress={() => router.replace('/auth')}>
            <IconSymbol name="person.fill" size={20} color={colors.accent} />
            <ThemedText style={[styles.actionText, { color: colors.accent }]}>{t('settings.logIn')}</ThemedText>
          </TouchableOpacity>
        )}

        {/* Delete Account — only for logged-in users */}
        {isLoggedIn && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.actionRow} onPress={confirmDelete}>
              <IconSymbol name="trash.fill" size={20} color={colors.error} />
              <ThemedText style={[styles.actionText, { color: colors.error }]}>
                {t('settings.deleteAccount')}
              </ThemedText>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ─── Delete Account Modal ──────────────────────────────────────── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={styles.modalTitle}>
              {t('settings.deleteAccountTitle')}
            </ThemedText>
            <ThemedText style={[styles.modalBody, { color: colors.textSecondary }]}>
              {t('settings.deleteAccountPasswordHint')}
            </ThemedText>

            <TextInput
              style={[styles.passwordInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder={t('auth.password')}
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {deleteError.length > 0 && (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {deleteError}
              </ThemedText>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                <ThemedText style={{ fontWeight: '600' }}>{t('common.cancel')}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDanger, { backgroundColor: colors.error }]}
                onPress={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <ThemedText style={{ color: '#FFF', fontWeight: '700' }}>
                    {t('settings.deleteAccountAction')}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnDanger: {},
});
