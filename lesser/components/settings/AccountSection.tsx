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
import { deleteAccount, changePassword } from '@/services/auth';

export function AccountSection() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { username, isLoggedIn, logout, mode, updateProfile, lastError, isLoading } = useAuth();
  const router = useRouter();

  const displayUsername = username || 'Guest';

  // ─── Modals State ─────────────────────────────────────────────────────────
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  
  const [showPassModal, setShowPassModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  const resetState = () => {
    setInternalError(null);
    setInternalLoading(false);
    setNewUsername('');
    setCurrentPass('');
    setNewPass('');
    setDeletePassword('');
    setDeleteConfirmationText('');
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) return;
    setInternalLoading(true);
    const success = await updateProfile({ username: newUsername.trim() });
    setInternalLoading(false);
    if (success) {
      setShowUserModal(false);
      resetState();
    } else {
      setInternalError(lastError || 'Error al actualizar usuario');
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPass || !newPass) return;
    setInternalLoading(true);
    setInternalError(null);
    try {
        const res = await changePassword(currentPass, newPass);
        if (res.success) {
            setShowPassModal(false);
            resetState();
            Alert.alert('Éxito', 'Contraseña actualizada correctamente');
        } else {
            setInternalError(res.error || 'Error al actualizar contraseña');
        }
    } catch (e) {
        setInternalError('Errorines inesperados');
    } finally {
        setInternalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setInternalError(t('settings.passwordRequired'));
      return;
    }
    setInternalLoading(true);
    setInternalError(null);

    const result = await deleteAccount(deletePassword);
    setInternalLoading(false);

    if (result.success) {
      setShowDeleteModal(false);
      router.replace('/auth');
    } else {
      setInternalError(result.error ?? t('settings.deleteAccountError'));
    }
  };

  const isDeleteButtonEnabled = deleteConfirmationText === 'ELIMINAR MI CUENTA' && deletePassword.length > 0;

  const confirmDelete = () => {
    Alert.alert(
      t('settings.deleteAccountTitle'),
      t('settings.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccountAction'),
          style: 'destructive',
          onPress: () => { resetState(); setShowDeleteModal(true); },
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

        {isLoggedIn && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.actionRow} onPress={() => { resetState(); setShowUserModal(true); }}>
              <IconSymbol name="pencil" size={20} color={colors.icon} />
              <ThemedText style={styles.actionText}>{t('settings.changeUsername')}</ThemedText>
              <IconSymbol name="chevron.right" size={18} color={colors.icon} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.actionRow} onPress={() => { resetState(); setShowPassModal(true); }}>
              <IconSymbol name="key.fill" size={20} color={colors.icon} />
              <ThemedText style={styles.actionText}>{t('settings.changePassword')}</ThemedText>
              <IconSymbol name="chevron.right" size={18} color={colors.icon} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.actionRow} onPress={confirmDelete}>
              <IconSymbol name="trash.fill" size={20} color={colors.error} />
              <ThemedText style={[styles.actionText, { color: colors.error }]}>
                {t('settings.deleteAccount')}
              </ThemedText>
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


      </View>

      {/* ─── Change Username Modal ─────────────────────────────────────── */}
      <Modal visible={showUserModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={styles.modalTitle}>Cambiar Usuario</ThemedText>
            <TextInput
              style={[styles.passwordInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="Nuevo nombre de usuario"
              placeholderTextColor={colors.textSecondary}
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
            />
            {internalError && <ThemedText style={[styles.errorText, { color: colors.error }]}>{internalError}</ThemedText>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setShowUserModal(false)}><ThemedText>Cancelar</ThemedText></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.accent }]} onPress={handleUpdateUsername}>
                {internalLoading ? <ActivityIndicator color="#FFF" /> : <ThemedText style={{ color: '#FFF' }}>Guardar</ThemedText>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Change Password Modal ─────────────────────────────────────── */}
      <Modal visible={showPassModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={styles.modalTitle}>Cambiar Contraseña</ThemedText>
            <TextInput
              style={[styles.passwordInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="Contraseña actual"
              secureTextEntry
              value={currentPass}
              onChangeText={setCurrentPass}
            />
            <TextInput
              style={[styles.passwordInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="Nueva contraseña"
              secureTextEntry
              value={newPass}
              onChangeText={setNewPass}
            />
            {internalError && <ThemedText style={[styles.errorText, { color: colors.error }]}>{internalError}</ThemedText>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setShowPassModal(false)}><ThemedText>Cancelar</ThemedText></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.accent }]} onPress={handleUpdatePassword}>
                {internalLoading ? <ActivityIndicator color="#FFF" /> : <ThemedText style={{ color: '#FFF' }}>Actualizar</ThemedText>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Delete Account Modal ───────────────────────────────────────── */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={styles.modalTitle}>{t('settings.deleteAccountTitle')}</ThemedText>
            <ThemedText style={{ textAlign: 'center', opacity: 0.7 }}>{t('settings.deleteAccountPasswordHint')}</ThemedText>
            
            <TextInput
              style={[styles.passwordInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="Contraseña"
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
            />

            <ThemedText style={{ textAlign: 'center', fontSize: 13, marginTop: 8 }}>
              Escribe <ThemedText style={{ fontWeight: 'bold' }}>ELIMINAR MI CUENTA</ThemedText> para confirmar:
            </ThemedText>

            <TextInput
              style={[styles.passwordInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="ELIMINAR MI CUENTA"
              value={deleteConfirmationText}
              onChangeText={setDeleteConfirmationText}
              autoCapitalize="characters"
            />

            {internalError && <ThemedText style={[styles.errorText, { color: colors.error }]}>{internalError}</ThemedText>}
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setShowDeleteModal(false)}><ThemedText>Cancelar</ThemedText></TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: isDeleteButtonEnabled ? colors.error : colors.border, opacity: isDeleteButtonEnabled ? 1 : 0.5 }]} 
                onPress={handleDeleteAccount}
                disabled={!isDeleteButtonEnabled}
              >
                {internalLoading ? <ActivityIndicator color="#FFF" /> : <ThemedText style={{ color: '#FFF' }}>Eliminar</ThemedText>}
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
