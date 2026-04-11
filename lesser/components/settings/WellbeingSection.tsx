import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, ActivityIndicator, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { t } from '@/constants/i18n';
import { VpnThrottle } from '@/hooks/useVpnThrottle';

export function WellbeingSection() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [isEnabled, setIsEnabled] = useState(false);
  const [currentDelay, setCurrentDelay] = useState(0);
  const [loading, setLoading] = useState(false);

  // Poll for current delay if enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isEnabled && Platform.OS === 'android') {
      interval = setInterval(async () => {
        const delay = await VpnThrottle.getCurrentDelay();
        setCurrentDelay(delay);
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isEnabled]);

  const toggleVpn = async (value: boolean) => {
    if (Platform.OS !== 'android') return;
    
    setLoading(true);
    if (value) {
      const started = await VpnThrottle.start();
      setIsEnabled(started);
      if (!started) {
        // Fallback if permission denied
        setIsEnabled(false);
      }
    } else {
      await VpnThrottle.stop();
      setIsEnabled(false);
      setCurrentDelay(0);
    }
    setLoading(false);
  };

  if (Platform.OS !== 'android') return null;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>{t('wellbeing.title')}</ThemedText>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <ThemedText style={styles.title}>{t('wellbeing.vpnTitle')}</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('wellbeing.vpnSubtitle')}
            </ThemedText>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Switch
              value={isEnabled}
              onValueChange={toggleVpn}
              trackColor={{ false: colors.border, true: colors.accent + '88' }}
              thumbColor={isEnabled ? colors.accent : '#f4f3f4'}
            />
          )}
        </View>

        {isEnabled && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.statusRow}>
              <View style={[styles.delayBadge, { backgroundColor: colors.accent + '22' }]}>
                <IconSymbol name="timer" size={16} color={colors.accent} />
                <ThemedText style={[styles.delayText, { color: colors.accent }]}>
                  {t('wellbeing.currentDelay', { ms: currentDelay })}
                </ThemedText>
              </View>
              <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
                {t('wellbeing.delayDescription')}
              </ThemedText>
            </View>
          </>
        )}
      </View>
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
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  statusRow: {
    gap: 12,
  },
  delayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  delayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
