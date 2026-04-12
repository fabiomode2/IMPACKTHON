import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/constants/i18n';

export function GoalSection() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { user, updateProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);

  // Default to 4 hours (240 mins)
  const currentGoalMinutes = user?.goalMinutes ?? 240;

  const handleUpdate = async (newMinutes: number) => {
    // Limits: min 0, max 24h (1440 mins)
    if (newMinutes < 0 || newMinutes > 1440) return;
    setLoading(true);
    await updateProfile({ goalMinutes: newMinutes });
    setLoading(false);
  };

  const increase = () => handleUpdate(currentGoalMinutes + 30);
  const decrease = () => handleUpdate(currentGoalMinutes - 30);

  const formatHours = (mins: number) => {
    const hrs = mins / 60;
    return hrs % 1 === 0 ? `${hrs}h` : `${hrs.toFixed(1)}h`;
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 }}>
        <IconSymbol name="timer" size={20} color={colors.textSecondary} />
        <ThemedText style={styles.sectionTitle}>{t('settings.goal')}</ThemedText>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <ThemedText style={styles.title}>{t('settings.timeLimit')}</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('settings.adjustGoal')}
            </ThemedText>
          </View>
          
          <View style={styles.controls}>
            <TouchableOpacity 
              onPress={decrease} 
              disabled={loading || currentGoalMinutes <= 0}
              style={[styles.controlBtn, { backgroundColor: colors.accent + '22', opacity: (loading || currentGoalMinutes <= 0) ? 0.3 : 1 }]}
            >
              <IconSymbol name="minus" size={20} color={colors.accent} />
            </TouchableOpacity>
            
            <View style={styles.valueContainer}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <ThemedText style={styles.valueText}>{formatHours(currentGoalMinutes)}</ThemedText>
              )}
            </View>
            
            <TouchableOpacity 
              onPress={increase} 
              disabled={loading || currentGoalMinutes >= 1440}
              style={[styles.controlBtn, { backgroundColor: colors.accent + '22', opacity: (loading || currentGoalMinutes >= 1440) ? 0.3 : 1 }]}
            >
              <IconSymbol name="plus" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  valueContainer: {
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 22,
    fontWeight: '800',
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
