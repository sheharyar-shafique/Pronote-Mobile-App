import { isNative } from './platform';

/**
 * Native voice recorder facade.
 *
 * Currently the app uses the browser MediaRecorder (via the recording store) on
 * both web and inside Capacitor's WebView, which works on iOS 14.3+ and all
 * Android WebViews we target. The functions below are placeholders so that we
 * can swap in a native plugin (e.g. `capacitor-voice-recorder`, which is the
 * un-scoped package — `@capacitor-community/voice-recorder` referenced earlier
 * is NOT published on npm) without changing call sites.
 */

export interface RecordingResult {
  base64Audio: string;
  mimeType: string;
  durationMs: number;
}

export async function requestMicPermission(): Promise<boolean> {
  // For now, always go through the browser permission API — works in WKWebView and
  // Android WebView. The native helper wiring lives behind isNative() so we can
  // swap to a plugin later without touching call sites.
  void isNative;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

export async function startRecording(): Promise<void> {
  throw new Error(
    'native startRecording is a stub — the app uses the MediaRecorder flow in src/store/index.ts'
  );
}

export async function stopRecording(): Promise<RecordingResult> {
  throw new Error(
    'native stopRecording is a stub — the app uses the MediaRecorder flow in src/store/index.ts'
  );
}

export async function pauseRecording(): Promise<void> {}
export async function resumeRecording(): Promise<void> {}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}
