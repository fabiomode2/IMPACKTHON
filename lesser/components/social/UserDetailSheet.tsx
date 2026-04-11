import React, { useState, useEffect, useMemo } from 'react';
import {
  View, StyleSheet, Modal, TouchableOpacity,
  ActivityIndicator, Pressable, Platform, Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { useSocial } from '@/hooks/useSocial';
import { fetchUsageStats, UsageStats } from '@/services/usage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UserDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  userUid: string | null;
  username: string | null;
}

export function UserDetailSheet({ visible, onClose, userUid, username }: UserDetailSheetProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { user } = useAuth();
  const { following, follow, unfollow } = useSocial(user?.uid ?? null, user?.username ?? null);

  const [loading, setLoading] = useState(false);
  const [profileStats, setProfileStats] = useState<UsageStats | null>(null);

  const isFol = useMemo(() => following.some(f => f.uid === userUid), [following, userUid]);

  useEffect(() => {
    if (visible && userUid) {
      const loadData = async () => {
        if (!userUid) return;
        setLoading(true);
        try {
          const stats = await fetchUsageStats(userUid);
          setProfileStats(stats);
        } catch (e) {
          console.error('Failed to load user stats for sheet:', e);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [visible, userUid]);

  const handleToggleFollow = async () => {
    if (!userUid || !profileStats) return;
    if (isFol) {
      await unfollow(userUid);
    } else {
      await follow(userUid, username || 'User');
    }
  };

  if (!userUid) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.flexFiller} />
        <BlurView 
            intensity={Platform.OS === 'ios' ? 40 : 100} 
            tint={theme === 'dark' ? 'dark' : 'light'}
            style={styles.blurWrapper}
        >
            <Pressable 
            style={[styles.sheet, { backgroundColor: theme === 'dark' ? 'rgba(20,20,20,0.8)' : 'rgba(255,255,255,0.85)' }]}
            onPress={(e) => e.stopPropagation()}
            >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            
            {loading ? (
                <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : (
                <View style={styles.content}>
                <View style={styles.header}>
                    <View style={[styles.avatar, { backgroundColor: colors.accent + '20' }]}>
                    <ThemedText style={[styles.avatarText, { color: colors.accent }]}>
                        {(username || 'U').charAt(0).toUpperCase()}
                    </ThemedText>
                    </View>
                    <ThemedText style={styles.username}>@{username || 'User'}</ThemedText>
                    <ThemedText style={[styles.streakText, { color: colors.textSecondary }]}>
                    🔥 {profileStats?.streakDays ?? 0} días de racha
                    </ThemedText>
                </View>

              <View style={styles.statsGrid}>
                <StatCard 
                  label="Uso Diario" 
                  value={`${profileStats?.hours24h.toFixed(1) ?? 0}h`} 
                  colors={colors} 
                />
                <StatCard 
                    label="Ranking" 
                    value={`Top ${profileStats?.topPercentage ?? 50}%`} 
                    colors={colors} 
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.followBtn,
                  { backgroundColor: isFol ? colors.background : colors.accent, borderColor: isFol ? colors.border : colors.accent, borderWidth: 1 }
                ]}
                onPress={handleToggleFollow}
                activeOpacity={0.8}
              >
                <ThemedText style={[styles.followBtnText, { color: isFol ? colors.text : '#FFF' }]}>
                  {isFol ? 'Dejar de seguir' : 'Seguir ahora'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <ThemedText style={{ color: colors.textSecondary }}>Cerrar</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </BlurView>
    </Pressable>
  </Modal>
  );
}

function StatCard({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  flexFiller: { flex: 1 },
  blurWrapper: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  sheet: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    paddingTop: 12,
    minHeight: SCREEN_HEIGHT * 0.45,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { gap: 24 },
  header: { alignItems: 'center', gap: 8 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800' },
  username: { fontSize: 22, fontWeight: '800' },
  streakText: { fontSize: 15, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: '800' },
  followBtn: {
    height: 60,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  followBtnText: { fontSize: 17, fontWeight: '800' },
  closeBtn: { alignItems: 'center', paddingVertical: 12 },
});
