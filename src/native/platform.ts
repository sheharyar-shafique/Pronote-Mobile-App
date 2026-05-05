import { Capacitor } from '@capacitor/core';

/**
 * Dev-only platform simulation. Allows verifying iOS-only / Android-only UI
 * paths from a regular browser at localhost without needing a TestFlight build
 * or a connected Android device. Use one of:
 *
 *   http://localhost:5173/?simulate=ios       ← isIOS() returns true
 *   http://localhost:5173/?simulate=android   ← isAndroid() returns true
 *   localStorage.setItem('pronote_simulate_platform', 'ios')   ← persistent
 *
 * Strictly gated on import.meta.env.DEV so it CANNOT be exploited in
 * production — Vite literally compiles the dev branch out of the prod bundle.
 */
function getSimulatedPlatform(): 'ios' | 'android' | null {
  if (!import.meta.env.DEV) return null;
  if (typeof window === 'undefined') return null;
  const fromUrl = new URLSearchParams(window.location.search).get('simulate');
  if (fromUrl === 'ios' || fromUrl === 'android') {
    try { localStorage.setItem('pronote_simulate_platform', fromUrl); } catch {}
    return fromUrl;
  }
  try {
    const fromStorage = localStorage.getItem('pronote_simulate_platform');
    if (fromStorage === 'ios' || fromStorage === 'android') return fromStorage;
  } catch {}
  return null;
}

export const isNative = (): boolean => Capacitor.isNativePlatform();

export const isIOS = (): boolean =>
  Capacitor.getPlatform() === 'ios' || getSimulatedPlatform() === 'ios';

export const isAndroid = (): boolean =>
  Capacitor.getPlatform() === 'android' || getSimulatedPlatform() === 'android';

export const isWeb = (): boolean =>
  Capacitor.getPlatform() === 'web' && getSimulatedPlatform() === null;

export const getPlatform = (): 'ios' | 'android' | 'web' => {
  const sim = getSimulatedPlatform();
  if (sim) return sim;
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};
