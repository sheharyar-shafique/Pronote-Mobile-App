import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAppShell } from './native/app-shell';
import { isNative } from './native/platform';

// On iOS / Android, hide the splash, configure the status bar + keyboard insets,
// and wire the Android hardware back button. No-op on the web build so the same
// codebase works in both Vite dev and inside the Capacitor WebView.
if (isNative()) {
  initAppShell().catch((err) => {
    console.error('[native] initAppShell failed:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
