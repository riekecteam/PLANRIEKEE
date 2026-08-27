import { useState, useEffect, useCallback } from 'react';
import type { AppData } from '@/types';

const STORAGE_KEY = 'planner-rieke-data-v1';

const emptyData: AppData = {
  tasks: [],
  events: [],
  notes: [],
  priorities: [],
  weeklyGoals: [],
  monthlyGoals: [],
  importantDates: [],
  daily: [],
  weekly: [],
  monthly: [],
  tweets: [],
  settings: {
    name: 'Rieke',
    firstDayOfWeek: 'Monday',
    defaultReminder: null,
    onboarded: false,
  },
};

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      ...emptyData,
      ...parsed,
      settings: { ...emptyData.settings, ...parsed.settings },
    };
  } catch {
    return emptyData;
  }
}

export function useStore() {
  const [data, setData] = useState<AppData>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full or unavailable — fail silently
    }
  }, [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => fn(structuredClone(prev)));
  }, []);

  const replaceAll = useCallback((newData: AppData) => {
    setData(newData);
  }, []);

  return { data, update, replaceAll };
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export { STORAGE_KEY, emptyData };
