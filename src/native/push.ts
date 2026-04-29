import { PushNotifications, type Token } from '@capacitor/push-notifications';
import { isNative } from './platform';

/**
 * Register the device for push notifications. The token returned should be POSTed
 * to your backend so it can be associated with the user's account. On the backend,
 * use APNs (iOS) or FCM (Android) to deliver the notification.
 */
export async function registerForPush(
  onToken: (token: string) => Promise<void> | void,
): Promise<void> {
  if (!isNative()) return;

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (t: Token) => {
    await onToken(t.value);
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration failed', err);
  });
}
