import React, { useEffect, useState } from 'react';
import { View, Text, Button, Platform } from 'react-native';
import {
  getUsageLast24h,
  isUsageAccessGranted,
  openUsageAccessSettings,
  isScreenTimeNativeLoaded,
  formatDuration,
} from './screenTime';

export default function ScreenTimeCard() {
  const [platform] = useState(Platform.OS);
  const [nativeLoaded, setNativeLoaded] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    'checking' | 'granted' | 'denied' | 'unavailable'
  >('checking');
  const [last24h, setLast24h] = useState('0 min');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setNativeLoaded(isScreenTimeNativeLoaded);

      if (Platform.OS !== 'android') {
        setPermissionStatus('unavailable');
        return;
      }

      if (!isScreenTimeNativeLoaded) {
        setPermissionStatus('unavailable');
        return;
      }

      const granted = await isUsageAccessGranted();
      setPermissionStatus(granted ? 'granted' : 'denied');

      if (!granted) return;

      const usage = await getUsageLast24h();
      setLast24h(formatDuration(usage.totalMs));
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={{ padding: 16, backgroundColor: '#fff', borderRadius: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
        Tiempo de pantalla
      </Text>

      <Text style={{ fontSize: 14, marginBottom: 4 }}>
        Usado en las últimas 24h
      </Text>
      <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 16 }}>
        {last24h}
      </Text>

      <View
        style={{
          backgroundColor: '#F59E0B',
          padding: 12,
          borderRadius: 10,
          marginBottom: 12,
        }}
      >
        <Text>Diagnóstico de Sistema:</Text>
        <Text>Plataforma actual: {platform}</Text>
        <Text>Módulo Nativo Kotlin Cargado: {nativeLoaded ? 'SÍ' : 'NO'}</Text>
        <Text>Estado del Permiso: {permissionStatus}</Text>
        {!!error && <Text>Error: {error}</Text>}
      </View>

      {Platform.OS === 'android' && nativeLoaded && permissionStatus === 'denied' && (
        <Button
          title="Conceder acceso de uso"
          onPress={openUsageAccessSettings}
        />
      )}

      {Platform.OS === 'android' && (
        <View style={{ marginTop: 8 }}>
          <Button title="Recargar tiempo de pantalla" onPress={load} />
        </View>
      )}
    </View>
  );
}
