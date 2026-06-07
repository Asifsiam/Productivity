import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

export function useStorage<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then(raw => {
        if (raw !== null) setData(JSON.parse(raw));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [key]);

  const save = useCallback(async (value: T) => {
    setData(value);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }, [key]);

  return { data, save, loading };
}
