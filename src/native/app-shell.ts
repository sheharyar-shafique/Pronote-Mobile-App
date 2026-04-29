import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { isNative, isIOS } from './platform';

/**
 * Initialise the native app shell: status bar, splash, hardware-back handling,
 * keyboard insets. Call once from the app's entry point on native platforms.
 *
 *   if (isNative()) await initAppShell();
 */
export async function initAppShell(): Promise<void> {
  if (!isNative()) return;

  await StatusBar.setStyle({ style: Style.Dark });
  if (!isIOS()) {
    await StatusBar.setBackgroundColor({ color: '#ffffff' });
  }

  await SplashScreen.hide({ fadeOutDuration: 300 });

  Keyboard.addListener('keyboardWillShow', (info) => {
    document.documentElement.style.setProperty('--kb-height', `${info.keyboardHeight}px`);
  });
  Keyboard.addListener('keyboardWillHide', () => {
    document.documentElement.style.setProperty('--kb-height', '0px');
  });

  // Android hardware back: navigate history if possible, otherwise minimise.
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.minimizeApp();
    }
  });
}
