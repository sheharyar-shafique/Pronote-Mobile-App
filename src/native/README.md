# Native bridge helpers

These helpers are **opt-in**. Your existing `frontend/` code keeps working in the
Capacitor WebView without any changes. Use these only when you want to swap a
web API for its native equivalent (better mic quality, secure storage, push,
status bar, etc.).

## How to wire them in (without disturbing the web app)

The cleanest way is to import these from `frontend/src` lazily, behind a
platform check. Example for `CapturePage`:

```ts
import { Capacitor } from '@capacitor/core';

async function startMicRecording() {
  if (Capacitor.isNativePlatform()) {
    const { startRecording, requestMicPermission } = await import(
      // path resolved when the mobile build runs from /mobile
      '../../../mobile/bridge/audio'
    );
    const ok = await requestMicPermission();
    if (!ok) throw new Error('Mic permission denied');
    await startRecording();
  } else {
    // existing MediaRecorder flow
  }
}
```

Or, easier: copy `bridge/` into `frontend/src/native/` so it's resolvable from
both builds. The web build will tree-shake out the imports because they're
gated behind `Capacitor.isNativePlatform()` (which is `false` on the web
bundle when no Capacitor runtime is present — the helpers also short-circuit
on `isNative() === false`).

## Files

- `platform.ts` — `isNative()`, `isIOS()`, `isAndroid()`, `getPlatform()`.
- `audio.ts` — native mic recording via `@capacitor-community/voice-recorder`.
  Returns base64 you can convert to a Blob and POST to `/audio` like the web flow.
- `storage.ts` — sandboxed key/value (UserDefaults / SharedPreferences) with
  localStorage fallback. Use this for the JWT instead of `localStorage` on mobile.
- `app-shell.ts` — status bar, splash, keyboard insets, Android back button.
  Call `initAppShell()` once at app start.
- `push.ts` — APNs / FCM registration. Pass the token to your backend.
