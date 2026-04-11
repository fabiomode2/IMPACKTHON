import React from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { generateFriendSupportMessage } from '@/services/llm';
import { useEffect, useState } from 'react';

export interface FeedItemData {
  id: string;
  uid: string;
  username: string;
  days: number;
  value?: number;
  type: 'STREAK' | 'USAGE_REDUCTION' | 'TOP_RANK';
  message?: string;
  photoUrl?: string;
  timestamp: string;
}

interface FeedItemProps {
  data: FeedItemData;
}

export function FeedItem({ data }: FeedItemProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const getAchievementDetails = () => {
    switch (data.type) {
      case 'STREAK':
        return {
          icon: 'flame.fill',
          color: '#FF9500',
          text: `¡Ha alcanzado una racha de ${data.days} días!`,
          subtext: 'La disciplina es la clave del progreso.',
        };
      case 'USAGE_REDUCTION':
        return {
          icon: 'arrow.down.circle.fill',
          color: '#34C759',
          text: `¡Ha reducido su uso un ${data.value}% today!`,
          subtext: 'Ganando tiempo para lo que realmente importa.',
        };
      case 'TOP_RANK':
        return {
          icon: 'trophy.fill',
          color: '#FFCC00',
          text: `¡Está en el Top ${data.value}% del mundo!`,
          subtext: 'Un ejemplo de control y enfoque.',
        };
      default:
        return {
          icon: 'star.fill',
          color: colors.accent,
          text: '¡Ha conseguido un nuevo logro!',
          subtext: 'Sigue así.',
        };
    }
  };

  const details = getAchievementDetails();
  const [aiSupport, setAiSupport] = useState<string | null>(null);

  useEffect(() => {
    async function loadSupportMessage() {
      const msg = await generateFriendSupportMessage(data.username, data.type, data.days || data.value || 0);
      setAiSupport(msg);
    }
    loadSupportMessage();
  }, [data.username, data.type, data.days, data.value]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: details.color + '22' }]}>
          <ThemedText style={[styles.avatarText, { color: details.color }]}>
            {data.username.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.headerText}>
          <ThemedText style={styles.username}>@{data.username}</ThemedText>
          <ThemedText style={[styles.time, { color: colors.textSecondary }]}>{data.timestamp}</ThemedText>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: details.color + '15' }]}>
          <IconSymbol name={details.icon as any} size={14} color={details.color} />
        </View>
      </View>
      
      <View style={styles.body}>
        <ThemedText style={styles.achievementTitle}>
          {details.text}
        </ThemedText>
        <ThemedText style={[styles.subtext, { color: colors.textSecondary }]}>
          {details.subtext}
        </ThemedText>

        {/* AI Supportive Reserved Space */}
        <View style={[styles.aiBubble, { backgroundColor: colors.accent + '05', borderColor: aiSupport ? colors.accent + '20' : colors.border + '50' }]}>
          <View style={styles.aiBubbleHeader}>
            <IconSymbol name="sparkles.rectangle.stack.fill" size={14} color={colors.accent} />
            <ThemedText style={[styles.aiLabel, { color: colors.accent }]}>Lesser AI Friend Support</ThemedText>
            {!aiSupport && <ActivityIndicator size="small" color={colors.accent} style={{ transform: [{ scale: 0.7 }] }} />}
          </View>
          {aiSupport ? (
            <ThemedText style={[styles.aiText, { color: colors.text }]}>
              {aiSupport}
            </ThemedText>
          ) : (
            <View style={styles.aiSkeleton} />
          )}
        </View>
        
        {data.message && (
          <View style={[styles.messageBox, { backgroundColor: colors.background + '50' }]}>
            <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
              &ldquo;{data.message}&rdquo;
            </ThemedText>
          </View>
        )}

        {data.photoUrl && (
          <View style={styles.photoContainer}>
            <Image 
              source={{ uri: data.photoUrl }} 
              style={styles.photo} 
              resizeMode="cover" 
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    marginTop: 2,
  },
  typeBadge: {
    padding: 8,
    borderRadius: 12,
  },
  body: {
    gap: 6,
  },
  achievementTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  subtext: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    borderStyle: 'italic',
  },
  message: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  photoContainer: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 180,
    backgroundColor: '#000',
  },
  aiBubble: {
    gap: 6,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    borderStyle: 'dashed',
  },
  aiBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  aiSkeleton: {
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 7,
    width: '80%',
  },
});
