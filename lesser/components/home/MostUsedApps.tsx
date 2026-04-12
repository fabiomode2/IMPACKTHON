import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';

interface AppUsage {
  name: string;
  usageTime: number; // in minutes
  icon: string;
}

interface MostUsedAppsProps {
  apps: AppUsage[];
}

export function MostUsedApps({ apps }: MostUsedAppsProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  // Map our generic icons to string literal IconSymbolName correctly
  const getIconName = (name: string): IconSymbolName => {
    switch (name) {
      case 'camera': return 'camera.fill';
      case 'music-note': return 'music.note';
      case 'message-square': return 'message.fill';
      case 'tv': return 'tv.fill';
      case 'message-circle': return 'bubble.right.fill';
      default: return 'app.fill';
    }
  };

  const renderItem = ({ item }: { item: AppUsage }) => (
    <View style={[styles.itemContainer, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.border }]}>
        <IconSymbol name={getIconName(item.icon)} size={20} color={colors.text} />
      </View>
      <ThemedText style={styles.appName}>{item.name}</ThemedText>
      <View style={{ flex: 1 }} />
      <ThemedText style={[styles.timeText, { color: colors.textSecondary }]}>
        {Math.floor(item.usageTime / 60)}h {item.usageTime % 60}m
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ThemedText style={styles.title}>{t('home.mostUsedApps')}</ThemedText>
      <View style={styles.list}>
        {apps.map((app, idx) => (
          <View key={idx}>
            {renderItem({ item: app })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  list: {
    gap: 0,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 16,
  },
});
