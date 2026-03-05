'use client';

import { useSyncExternalStore, useCallback, useRef } from 'react';
import { NumberSet } from '@/lib/lotteries/types';

const STORAGE_KEY = 'myLottoStats:numberSets';

function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) || '[]';
}

function getServerSnapshot(): string {
  return '[]';
}

function parseSets(raw: string): NumberSet[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSets(sets: NumberSet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  // Trigger re-render via storage event for same-tab listeners
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

export function useNumberSets() {
  const listenersRef = useRef<Set<() => void>>(new Set());

  const subscribe = useCallback((callback: () => void) => {
    listenersRef.current.add(callback);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) callback();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      listenersRef.current.delete(callback);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const sets = parseSets(raw);
  const hydrated = true;

  const addSet = useCallback((set: Omit<NumberSet, 'id' | 'createdAt'>) => {
    const current = parseSets(getSnapshot());
    const newSet: NumberSet = {
      ...set,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveSets([...current, newSet]);
  }, []);

  const updateSet = useCallback((id: string, updates: Partial<Omit<NumberSet, 'id' | 'createdAt'>>) => {
    const current = parseSets(getSnapshot());
    saveSets(current.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteSet = useCallback((id: string) => {
    const current = parseSets(getSnapshot());
    saveSets(current.filter(s => s.id !== id));
  }, []);

  return { sets, hydrated, addSet, updateSet, deleteSet };
}
