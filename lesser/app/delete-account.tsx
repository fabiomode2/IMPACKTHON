import React, { useState } from 'react';
import {
  View, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { t } from '@/constants/i18n';
import { deleteAccount } from '@/services/auth';

/**
 * Screen for permanent account deletion with double confirmation.
 * Designed with high-impact "Danger" aesthetics.
 */
export default function DeleteAccountScreen() {
  const [password, setPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const isButtonEnabled = confirmationText === t('settings.deleteConfirmValue') && password.length > 0;

  const handleDelete = async () => {
    if (!isButtonEnabled) return;

    Alert.alert(
      t('settings.deleteConfirmTitle'),
      t('settings.deleteConfirmDesc'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('settings.deletePermanently'),
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            setError(null);
            
            const result = await deleteAccount(password);
            
            if (result.success) {
              router.replace('/auth');
            } else {
              setError(result.error || t('settings.deleteAccountError'));
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: t('settings.deleteAccountTitle'), headerShown: false }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.iconContainer}>
            <View style={[styles.iconPulse, { backgroundColor: colors.error + '20' }]} />
            <Ionicons name="warning-outline" size={60} color={colors.error} />
          </View>
          
          <ThemedText style={[styles.title, { color: colors.error }]}>
            {t('settings.deleteSureTitle')}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {t('settings.deleteSureSubtitle')}
          </ThemedText>
        </View>

        <View style={[styles.warningBox, { backgroundColor: colors.card, borderColor: colors.error + '40' }]}>
          <ThemedText style={styles.warningTitle}>{t('settings.deleteLoseTitle')}</ThemedText>
          <View style={styles.list}>
            <BulletItem text={t('settings.deleteLose1')} colors={colors} />
            <BulletItem text={t('settings.deleteLose2')} colors={colors} />
            <BulletItem text={t('settings.deleteLose3')} colors={colors} />
            <BulletItem text={t('settings.deleteLose4')} colors={colors} />
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('settings.deleteLabelPassword')}</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder={t('settings.deletePlaceholderPassword')}
              placeholderTextColor={colors.textSecondary + '70'}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              {t('settings.deleteLabelConfirmText', { text: t('settings.deleteConfirmValue') })}
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder={t('settings.deleteConfirmValue')}
              placeholderTextColor={colors.textSecondary + '70'}
              value={confirmationText}
              onChangeText={setConfirmationText}
              autoCapitalize="characters"
            />
          </View>

          {error && (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>
              {error}
            </ThemedText>
          )}

          <TouchableOpacity
            style={[
              styles.deleteButton,
              { backgroundColor: isButtonEnabled ? colors.error : colors.border },
              !isButtonEnabled && { opacity: 0.5 }
            ]}
            onPress={handleDelete}
            disabled={isLoading || !isButtonEnabled}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.deleteButtonText}>{t('settings.deletePermanently')}</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <ThemedText style={{ color: colors.textSecondary }}>{t('settings.deleteCancel')}</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BulletItem({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={styles.bulletItem}>
      <Ionicons name="close-circle" size={18} color={colors.error} style={{ marginTop: 2 }} />
      <ThemedText style={[styles.bulletText, { color: colors.textSecondary }]}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginTop: 10, marginBottom: 32 },
  backButton: { alignSelf: 'flex-start', padding: 8, marginBottom: 10 },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconPulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 12 },
  subtitle: { fontSize: 16, textAlign: 'center', opacity: 0.8, lineHeight: 22 },
  warningBox: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  warningTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
  list: { gap: 12 },
  bulletItem: { flexDirection: 'row', gap: 10 },
  bulletText: { fontSize: 14, flex: 1, lineHeight: 20 },
  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', marginLeft: 4, opacity: 0.9 },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: { textAlign: 'center', fontWeight: '700', fontSize: 14 },
  deleteButton: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  deleteButtonText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  cancelButton: { alignItems: 'center', paddingVertical: 12 },
});
