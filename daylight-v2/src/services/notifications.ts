// Local Notification helper for Daylight (web Notification API, or native Android when wrapped)
import { nativeBridge } from './native';

export function isNotificationSupported(): boolean {
  if (nativeBridge) return true;
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (nativeBridge) {
    try {
      return nativeBridge.hasNotificationPermission() ? 'granted' : 'default';
    } catch {
      return 'default';
    }
  }
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (nativeBridge) {
    if (nativeBridge.hasNotificationPermission()) return 'granted';
    return new Promise<NotificationPermission>((resolve) => {
      const onResult = (e: Event) => {
        window.removeEventListener('daylight_native_permission', onResult);
        clearTimeout(timer);
        resolve((e as CustomEvent<boolean>).detail ? 'granted' : 'denied');
      };
      const timer = setTimeout(() => {
        window.removeEventListener('daylight_native_permission', onResult);
        resolve(nativeBridge!.hasNotificationPermission() ? 'granted' : 'denied');
      }, 60000);
      window.addEventListener('daylight_native_permission', onResult);
      nativeBridge!.requestNotificationPermission();
    });
  }
  if (!isNotificationSupported()) return 'denied';
  try {
    return await Notification.requestPermission();
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return 'denied';
  }
}

export function showLocalNotification(title: string, options?: NotificationOptions): boolean {
  if (nativeBridge) {
    try {
      nativeBridge.showNotification(title, options?.body || "");
      return true;
    } catch {
      return false;
    }
  }
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }
  try {
    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch (e) {
    console.warn('Notification could not be shown:', e);
    return false;
  }
}

export function testNotification(): boolean {
  return showLocalNotification('☀️ Daylight', {
    body: 'Notifications are configured! You will receive task and timer reminders here.',
  });
}
