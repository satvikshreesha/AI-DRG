export const SESSION_STORAGE_KEY = "ai-drg.session.v2";

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota / private mode errors.
  }
}

export function clearStored(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignored.
  }
}
