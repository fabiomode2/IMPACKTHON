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
  } catch (e) {}
}

const checkPerm = () => {
  if (Platform.OS === 'android' && InstagramTrackerModule) {
    try { return InstagramTrackerModule.hasUsagePermission(); } catch (e) { return false; }
  }
  return true;
};

const requestPerm = () => {
  if (Platform.OS === 'android' && InstagramTrackerModule) {
    try { InstagramTrackerModule.requestUsagePermission(); } catch (e) {}
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

  const { login, register, skipAuth, isLoading } = useAuth();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const handleAction = async () => {
    setError(null);
    if (!usernameInput.trim() || !password.trim()) {
      setError(t('auth.fillAllFields'));
      return;
    }
    const success = isLogin
      ? await login(usernameInput, password)
      : await register(usernameInput, password);

    if (success) {
      if (!isLogin && Platform.OS === 'android') {
        if (!checkPerm()) {
          setShowPermissionScreen(true);
          return;
        }
      }
      router.replace('/(tabs)/home');
    } else {
      setError(t('auth.genericError'));
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
          </ThemedText>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder={t('auth.usernamePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={usernameInput}
            onChangeText={setUsernameInput}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          {error && (
            <ThemedText style={[styles.error, { color: colors.error }]}>{error}</ThemedText>
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

          <TouchableOpacity style={styles.switchButton} onPress={() => { setIsLogin(!isLogin); setError(null); }}>
            <ThemedText style={{ color: colors.accent }}>
              {isLogin ? t('auth.switchToRegister') : t('auth.switchToLogin')}
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
  header: { marginBottom: 40 },
  title: { fontSize: 34, marginBottom: 12 },
  subtitle: { fontSize: 16, lineHeight: 24 },
  form: { gap: 16 },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  switchButton: { alignItems: 'center', paddingVertical: 12 },
  footer: { marginTop: 40, alignItems: 'center' },
  skipButton: { padding: 16 },
  skipText: { fontSize: 16, textDecorationLine: 'underline' },
});
