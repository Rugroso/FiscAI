import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type StepKey = 'perfil' | 'regimen' | 'obligaciones' | 'calendario' | 'riesgos' | 'meta';
type Status = 'locked' | 'active' | 'done';

type ProgressState = Record<StepKey, Status> & { currentIndex: number };

const DEFAULT_STATE: ProgressState = {
  perfil: 'active',
  regimen: 'locked',
  obligaciones: 'locked',
  calendario: 'locked',
  riesgos: 'locked',
  meta: 'locked',
  currentIndex: 0,
};

const STORAGE_KEY = 'fiscai.progress.v1';

interface Ctx {
  state: ProgressState;
  markDone: (key: StepKey) => void;
  setActive: (key: StepKey) => void;
  reset: () => void;
}

const ProgressContext = createContext<Ctx | undefined>(undefined);

export const ProgressProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<ProgressState>(DEFAULT_STATE);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ProgressState;
          setState({ ...DEFAULT_STATE, ...parsed });
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const order: StepKey[] = useMemo(
    () => ['perfil', 'regimen', 'obligaciones', 'calendario', 'riesgos', 'meta'],
    []
  );

  const recalcCurrent = useCallback((draft: ProgressState) => {
    const idx = order.findIndex(k => draft[k] !== 'done');
    draft.currentIndex = idx === -1 ? order.length - 1 : Math.max(0, idx);
  }, [order]);

  const markDone = useCallback((key: StepKey) => {
    setState(prev => {
      const next = { ...prev };
      next[key] = 'done';
      // desbloquear siguiente
      const idx = order.indexOf(key);
      const nextKey = order[idx + 1];
      if (nextKey && next[nextKey] === 'locked') next[nextKey] = 'active';
      recalcCurrent(next);
      return next;
    });
  }, [order, recalcCurrent]);

  const setActive = useCallback((key: StepKey) => {
    setState(prev => {
      const next = { ...prev };
      order.forEach(k => {
        if (next[k] !== 'done') next[k] = 'locked';
      });
      next[key] = 'active';
      recalcCurrent(next);
      return next;
    });
  }, [order, recalcCurrent]);

  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  const value = useMemo(() => ({ state, markDone, setActive, reset }), [state, markDone, setActive, reset]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
};

export const useProgress = () => {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
};
