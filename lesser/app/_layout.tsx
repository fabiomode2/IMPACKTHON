import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useAppTimeTracker } from '@/hooks/useAppTimeTracker';
import { useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import SelfiePunishment from '@/components/SelfiePunishment';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isOnboarded, authCompleted, isLoading } = useAuth();
  
  // Initialize global background time tracker
  useAppTimeTracker();
  
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;
    // Don't redirect while Firebase is resolving auth state
    if (isLoading) return;

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
  }, [isOnboarded, authCompleted, isLoading, segments, router, navigationState?.key]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          // Smooth slide transition everywhere — no jarring fade flicker
          animation: 'ios_from_right',
          animationDuration: 280,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="stats" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="friend/[uid]" options={{ headerShown: false, animation: 'ios_from_right' }} />
        <Stack.Screen name="followers" options={{ headerShown: false, animation: 'ios_from_right' }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      <SelfiePunishment />
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
