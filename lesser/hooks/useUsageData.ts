import { useState, useEffect } from 'react';
import { subscribeToUsageData, UsageSummary } from '@/services/usage';

export function useUsageData(uid: string | null | undefined) {
  const [data, setData] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUsageData(uid, (newData) => {
      setData(newData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { data, loading };
}
