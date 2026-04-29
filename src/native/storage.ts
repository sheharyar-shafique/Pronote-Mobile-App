import { Preferences } from '@capacitor/preferences';
import { isNative } from './platform';

/**
 * Secure-ish key/value storage. On native, uses Capacitor Preferences
 * (UserDefaults / SharedPreferences). On web, falls back to localStorage.
 *
 * For JWTs and other sensitive values, prefer this over localStorage on mobile —
 * Preferences data is sandboxed to the app and not exposed to the browser cache.
 */
export const storage = {
  async get(key: string): Promise<string | null> {
    if (isNative()) {
      const { value } = await Preferences.get({ key });
      return value ?? null;
    }
    return localStorage.getItem(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (isNative()) {
      await Preferences.set({ key, value });
      return;
    }
    localStorage.setItem(key, value);
  },

  async remove(key: string): Promise<void> {
    if (isNative()) {
      await Preferences.remove({ key });
      return;
    }
    localStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    if (isNative()) {
      await Preferences.clear();
      return;
    }
    localStorage.clear();
  },
};
