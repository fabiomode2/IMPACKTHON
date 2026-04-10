import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface TopUsersBadgeProps {
  percentage: number;
}

export function TopUsersBadge({ percentage }: TopUsersBadgeProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <IconSymbol name="star.fill" size={20} color="#FFD60A" />
      <ThemedText style={styles.text}>
        You are in the <ThemedText style={{ fontWeight: 'bold' }}>top {percentage}%</ThemedText> of users!
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  text: {
    fontSize: 16,
  },
});
