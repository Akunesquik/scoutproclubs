import { useEffect, useState } from 'react';

/** useState persisté dans localStorage ; ignore silencieusement un stockage indisponible. */
export function useStoredState(key: string, fallback: string): [string, (value: string) => void] {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // stockage plein ou bloqué : la valeur reste simplement non mémorisée
    }
  }, [key, value]);

  return [value, setValue];
}
