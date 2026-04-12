import React, { useState } from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';

export function WhitelistSection() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [apps, setApps] = useState([
    { id: '1', name: 'WhatsApp', isWhitelisted: true, icon: 'message.fill' },
    { id: '2', name: 'Google Maps', isWhitelisted: true, icon: 'map.fill' },
    { id: '3', name: 'Spotify', isWhitelisted: false, icon: 'play.circle.fill' },
    { id: '4', name: 'Banking App', isWhitelisted: true, icon: 'building.columns.fill' },
  ]);

  const toggleApp = (id: string) => {
    setApps(apps.map(app => 
      app.id === id ? { ...app, isWhitelisted: !app.isWhitelisted } : app
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.sectionTitle}>{t('settings.whitelistTitle')}</ThemedText>
        <IconSymbol name="plus.circle.fill" size={24} color={colors.accent} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {apps.map((app, index) => (
          <React.Fragment key={app.id}>
            <View style={styles.row}>
              <View style={[styles.iconContainer, { backgroundColor: colors.border }]}>
                <IconSymbol name={app.icon as any} size={20} color={colors.text} />
              </View>
              <ThemedText style={styles.appName}>{app.name}</ThemedText>
              <Switch
                value={app.isWhitelisted}
                onValueChange={() => toggleApp(app.id)}
                trackColor={{ false: colors.border, true: colors.success }}
                // thumbColor={colors.background}
                ios_backgroundColor={colors.border}
              />
            </View>
            {index < apps.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
      <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
        {t('settings.whitelistHelper')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#8E8E9333',
    marginLeft: 76,
  },
  helperText: {
    fontSize: 13,
    paddingHorizontal: 8,
  },
});
