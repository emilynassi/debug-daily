import type { StoredData, DayState } from "./types";

const STORAGE_KEY = "debugdaily";

export function todayKey(): string {
  const d = new Date();
  return `ddaily-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function yesterdayKey(): string {
  const d = new Date(Date.now() - 86_400_000);
  return `ddaily-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function loadStore(): StoredData {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as StoredData;
  } catch {
    return { streak: 0, lastKey: null, total: 0 };
  }
}

export function saveStore(patch: Partial<StoredData>): void {
  try {
    const prev = loadStore();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...patch }));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function loadTodayState(): DayState | null {
  const key = todayKey();
  const store = loadStore();
  return (store[key] as DayState) ?? null;
}
