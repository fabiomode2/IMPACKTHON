import React, { useState } from 'react';
import {
  View, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, AppState,
} from 'react-native';
import { useRouter } from 'expo-router';

let InstagramTrackerModule: any = null;
if (Platform.OS === 'android') {
  try {
    InstagramTrackerModule = require('../modules/instagram-tracker').default;
  } catch (e) { }
}

const checkPerm = () => {
  if (Platform.OS === 'android' && InstagramTrackerModule) {
    try { return InstagramTrackerModule.hasUsagePermission(); } catch (e) { return false; }
  }
  return true;
};

const requestPerm = () => {
  if (Platform.OS === 'android' && InstagramTrackerModule) {
    try { InstagramTrackerModule.requestUsagePermission(); } catch (e) { }
  }
};
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { t } from '@/constants/i18n';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPermissionScreen, setShowPermissionScreen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, register, skipAuth, isLoading, lastError } = useAuth();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const handleAction = async () => {
    setLocalError(null);
    if (!usernameInput.trim() || !password.trim()) {
      setLocalError(t('auth.fillAllFields'));
      return;
    }

    const success = isLogin
      ? await login(usernameInput.trim(), password)
      : await register(usernameInput.trim(), password);

    if (success) {
      if (!isLogin && Platform.OS === 'android') {
        if (!checkPerm()) {
          setShowPermissionScreen(true);
          return;
        }
      }
      router.replace('/(tabs)/home');
    }
  };

  const handleSkip = () => {
    skipAuth();
    router.replace('/(tabs)/home');
  };

  React.useEffect(() => {
    if (showPermissionScreen) {
      const handleAppStateChange = (nextAppState: string) => {
        if (nextAppState === 'active') {
          if (checkPerm()) {
            setShowPermissionScreen(false);
            router.replace('/(tabs)/home');
          }
        }
      };
      const sub = AppState.addEventListener('change', handleAppStateChange);
      return () => sub.remove();
    }
  }, [showPermissionScreen, router]);

  if (showPermissionScreen) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <ThemedText type="title" style={{ fontSize: 34, marginBottom: 16, textAlign: 'center' }}>
            Permiso Necesario
          </ThemedText>
          <ThemedText style={{ fontSize: 16, lineHeight: 24, marginBottom: 40, textAlign: 'center', color: colors.textSecondary }}>
            Para que esta aplicación pueda monitorear tu uso real de Instagram, necesitamos permisos de acceso a datos de uso. Es estrictamente obligatorio concederlo para registrarte y continuar.
          </ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={requestPerm}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.buttonText}>Otorgar Permiso</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  const activeError = localError || lastError;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <View style={[styles.logoPlaceholder, { backgroundColor: colors.accent }]}>
            <ThemedText style={styles.logoText}>L</ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('auth.usernamePlaceholder')}</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="ej: juan_perez"
              placeholderTextColor={colors.textSecondary + '70'}
              value={usernameInput}
              onChangeText={setUsernameInput}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('auth.password')}</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary + '70'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          {activeError && (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '15' }]}>
              <ThemedText style={[styles.error, { color: colors.error }]}>{activeError}</ThemedText>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }, isLoading && { opacity: 0.7 }]}
            onPress={handleAction}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.buttonText}>
                {isLogin ? t('auth.loginButton') : t('auth.registerButton')}
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={() => { setIsLogin(!isLogin); setLocalError(null); }}>
            <ThemedText style={{ color: colors.textSecondary }}>
              {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
              <ThemedText style={{ color: colors.accent, fontWeight: '700' }}>
                {isLogin ? t('auth.registerButton') : t('auth.loginButton')}
              </ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={isLoading}>
            <ThemedText style={[styles.skipText, { color: colors.textSecondary }]}>
              {t('auth.skipButton')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: { marginBottom: 32, alignItems: 'center' },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    transform: [{ rotate: '-10deg' }],
  },
  logoText: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, lineHeight: 22, textAlign: 'center', maxWidth: 280 },
  form: { gap: 20 },
  inputWrapper: { gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  switchButton: { alignItems: 'center', paddingVertical: 12 },
  footer: { marginTop: 40, alignItems: 'center' },
  skipButton: { padding: 16 },
  skipText: { fontSize: 15, fontWeight: '600' },
});
