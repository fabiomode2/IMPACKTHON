import React, { useState } from 'react';
import {
  View, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { login, register, skipAuth, isLoading } = useAuth();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const handleAction = async () => {
    setError(null);
    if (!usernameInput.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    const success = isLogin
      ? await login(usernameInput, password)
      : await register(usernameInput, password);

    if (success) {
      router.replace('/(tabs)/home');
    } else {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleSkip = () => {
    skipAuth();
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isLogin
              ? 'Log in to sync your reduction progress with friends.'
              : 'Sign up to connect with friends and compete.'}
          </ThemedText>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Username"
            placeholderTextColor={colors.textSecondary}
            value={usernameInput}
            onChangeText={setUsernameInput}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Password"
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
                {isLogin ? 'Log In' : 'Sign Up'}
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={() => { setIsLogin(!isLogin); setError(null); }}>
            <ThemedText style={{ color: colors.accent }}>
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={isLoading}>
            <ThemedText style={[styles.skipText, { color: colors.textSecondary }]}>
              Skip for now
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

