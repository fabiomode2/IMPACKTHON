import React from 'react';
import { StyleSheet, ScrollView, SafeAreaView, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountSection } from '@/components/settings/AccountSection';
import { ModeSelector } from '@/components/settings/ModeSelector';
import { WhitelistSection } from '@/components/settings/WhitelistSection';
import { ThemedText } from '@/components/themed-text';

export default function SettingsScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 72 }]}>
        <View style={styles.header}>
          <ThemedText type="title">Settings</ThemedText>
        </View>

        <AccountSection />
        <ModeSelector />
        <WhitelistSection />
        
        <View style={styles.footer}>
          <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
            IMPACKTHON 2026 App - v1.0.0
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    marginBottom: 8,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    gap: 32,
    paddingBottom: 40,
  },
  footer: {
    marginTop: 20,
  }
});
