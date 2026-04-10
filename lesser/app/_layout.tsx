import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isOnboarded, authCompleted } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'onboarding';

    const timeout = setTimeout(() => {
      if (!isOnboarded && segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      } else if (isOnboarded && !authCompleted && segments[0] !== 'auth') {
        router.replace('/auth');
      } else if (isOnboarded && authCompleted && inAuthGroup) {
        router.replace('/(tabs)/home');
      } else if (isOnboarded && authCompleted && segments[0] === undefined) {
        router.replace('/(tabs)/home');
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [isOnboarded, authCompleted, segments, router, navigationState?.key]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="stats" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="friend/[uid]" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="followers" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
