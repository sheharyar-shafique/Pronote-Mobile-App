/**
 * Native UX bridge — small wrappers that no-op cleanly on the web build so
 * the same React code can run in Vite dev (browser), in Netlify, and inside
 * the iOS / Android Capacitor WebView. Importing these is safe everywhere.
 *
 * The point of haptic feedback specifically is twofold:
 *   1. It makes the app *feel* native (Apple's HIG explicitly calls this
 *      out as a hallmark of native iOS apps).
 *   2. Apple Reviewer Guideline 4.2 ("apps that are simply repackaged
 *      websites") is the single most common rejection cause for Capacitor
 *      apps. Concrete native APIs the app actually uses are the strongest
 *      argument we can make in App Review notes.
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { App, AppState } from '@capacitor/app';
import { isNative } from './platform';

/** Light tap — used on small UI moments that confirm a touch. */
export async function hapticLight(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* device without haptic engine */ }
}

/** Medium tap — used when a process starts, e.g. recording starts. */
export async function hapticMedium(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch { /* fallthrough */ }
}

/** Heavy tap — used when a destructive or high-stakes action commits. */
export async function hapticHeavy(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch { /* fallthrough */ }
}

/** Success buzz — used when a long-running action completes successfully. */
export async function hapticSuccess(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch { /* fallthrough */ }
}

/** Error buzz — used when an action fails. */
export async function hapticError(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch { /* fallthrough */ }
}

/**
 * Track when the app went to the background. Used by the inactivity-timeout
 * logic so a HIPAA auto-logout fires correctly when the user returns to a
 * backgrounded app after the timeout window has elapsed (the in-process
 * timer alone doesn't run while the OS has the app suspended).
 */
let lastBackgroundTimestamp: number | null = null;

export function getLastBackgroundTimestamp(): number | null {
  return lastBackgroundTimestamp;
}

/**
 * Subscribe to native app foreground / background transitions. Returns an
 * unsubscribe function. On the web (where there are no foreground / background
 * events with the same semantics), uses Page Visibility as a best-effort
 * fallback so the same auto-logout behavior applies in browser dev too.
 */
export function onAppStateChange(handler: (state: AppState) => void): () => void {
  if (isNative()) {
    const listenerHandle = App.addListener('appStateChange', (state: AppState) => {
      lastBackgroundTimestamp = state.isActive ? null : Date.now();
      handler(state);
    });
    return () => {
      listenerHandle.then((h) => h.remove());
    };
  }

  // Web fallback: piggyback on Page Visibility for parity in browser dev.
  const onVisibility = () => {
    const isActive = document.visibilityState === 'visible';
    lastBackgroundTimestamp = isActive ? null : Date.now();
    handler({ isActive });
  };
  document.addEventListener('visibilitychange', onVisibility);
  return () => document.removeEventListener('visibilitychange', onVisibility);
}
