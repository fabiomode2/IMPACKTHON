import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export interface FeedItemData {
  id: string;
  uid: string;
  username: string;
  days: number;
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

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <ThemedText style={styles.avatarText}>{data.username.charAt(0).toUpperCase()}</ThemedText>
        </View>
        <View style={styles.headerText}>
          <ThemedText style={styles.username}>{data.username}</ThemedText>
          <ThemedText style={[styles.time, { color: colors.textSecondary }]}>{data.timestamp}</ThemedText>
        </View>
      </View>
      
      <View style={styles.body}>
        <ThemedText style={styles.updateText}>
          <IconSymbol name="flame.fill" size={16} color={colors.accent} />
          {' '}Ha estado reduciendo su uso por <ThemedText style={{ fontWeight: 'bold' }}>{data.days} días</ThemedText>!
        </ThemedText>
        
        {data.message && (
          <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
            "{data.message}"
          </ThemedText>
        )}

        {data.photoUrl && (
          <View style={styles.photoContainer}>
            <Image 
              source={{ uri: data.photoUrl }} 
              style={styles.photo} 
              resizeMode="cover" 
            />
            <View style={styles.photoOverlay}>
              <ThemedText style={styles.photoCaption}>¡Atrapado mirando el móvil!</ThemedText>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: '#8E8E9330',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  body: {
    gap: 12,
  },
  updateText: {
    fontSize: 16,
    lineHeight: 24,
  },
  message: {
    fontStyle: 'italic',
    fontSize: 15,
  },
  photoContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  photoCaption: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
