import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { followUser } from '@/services/social';
import { useAuth } from '@/hooks/useAuth';

const MOCK_USERS = [
  { uid: 'mock_1', username: 'AlexGamer' },
  { uid: 'mock_2', username: 'Sara_99' },
  { uid: 'mock_3', username: 'MarcosRock' },
  { uid: 'mock_4', username: 'LauraPro' },
  { uid: 'mock_5', username: 'JuanX' },
];

export function DevTools() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSeed = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión primero.');
      return;
    }

    Alert.alert(
      'Generar Entorno de Pruebas',
      'Esto inyectará 5 usuarios fantasma en tu base de datos y hará que se sigan entre sí y contigo. Útil para testear el buscador y las listas.\n\n¿Proceder?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, generar', 
          style: 'destructive',
          onPress: async () => await runSeed(user.uid, user.username)
        }
      ]
    );
  };

  const runSeed = async (myUid: string, myUsername: string) => {
    setIsLoading(true);
    try {
      // 1. Create the mock users in the DB
      const batch = writeBatch(db);
      MOCK_USERS.forEach(mock => {
        const ref = doc(db, 'users', mock.uid);
        batch.set(ref, {
          username: mock.username,
          username_lowercase: mock.username.toLowerCase(),
          email: `${mock.username.toLowerCase()}@mock.test`,
          mode: 'mid',
          streakDays: Math.floor(Math.random() * 50) + 1,
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();

      // 2. Automatically generate social links (followings)
      // I will follow AlexGamer and Sara_99
      await followUser(myUid, MOCK_USERS[0].uid, myUsername, MOCK_USERS[0].username);
      await followUser(myUid, MOCK_USERS[1].uid, myUsername, MOCK_USERS[1].username);

      // MarcosRock and LauraPro will follow ME
      await followUser(MOCK_USERS[2].uid, myUid, MOCK_USERS[2].username, myUsername);
      await followUser(MOCK_USERS[3].uid, myUid, MOCK_USERS[3].username, myUsername);

      // They follow each other a bit
      await followUser(MOCK_USERS[0].uid, MOCK_USERS[4].uid, MOCK_USERS[0].username, MOCK_USERS[4].username);
      await followUser(MOCK_USERS[1].uid, MOCK_USERS[2].uid, MOCK_USERS[1].username, MOCK_USERS[2].username);
      
      Alert.alert('¡Éxito!', 'Usuarios de prueba generados e interconectados.');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <ThemedText style={{ fontSize: 13, fontWeight: '700', marginBottom: 12, color: colors.textSecondary }}>
        OPCIONES DE DESARROLLADOR
      </ThemedText>
      
      <TouchableOpacity 
        style={[styles.btn, { backgroundColor: colors.accent + '22' }]} 
        onPress={handleSeed}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <ThemedText style={[styles.btnText, { color: colors.accent }]}>
            🛠 Inyectar Usuarios Fantasma (Seed)
          </ThemedText>
        )}
      </TouchableOpacity>
      <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 10, textAlign: 'center' }}>
        Genera usuarios aleatorios en Firebase para probar la red.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontWeight: '700',
    fontSize: 14,
  }
});
