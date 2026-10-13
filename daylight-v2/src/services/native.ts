// Bridge to the Android wrapper (window.DaylightNative is injected by MainActivity).
// In a normal browser it's undefined and everything falls back to web APIs.

export interface ScheduledItem {
  id: string;
  at: number; // epoch ms
  title: string;
  body: string;
  kind: 'alarm' | 'reminder' | 'focus';
}

interface DaylightNativeBridge {
  showNotification(title: string, body: string): void;
  hasNotificationPermission(): boolean;
  requestNotificationPermission(): void;
  syncSchedule(group: string, json: string): void;
  saveFile(fileName: string, mime: string, base64: string): void;
  setDarkSystemBars(dark: boolean): void;
}

export const nativeBridge: DaylightNativeBridge | undefined =
  typeof window !== 'undefined'
    ? (window as unknown as { DaylightNative?: DaylightNativeBridge }).DaylightNative
    : undefined;

export const isNativeApp = !!nativeBridge;

export function syncNativeSchedule(group: string, items: ScheduledItem[]): void {
  if (!nativeBridge) return;
  try {
    nativeBridge.syncSchedule(group, JSON.stringify(items));
  } catch (e) {
    console.warn('syncSchedule failed', e);
  }
}

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

/** Save a text file (browser download or Android "Save as" dialog). */
export function saveTextFile(fileName: string, mime: string, text: string): void {
  if (nativeBridge) {
    nativeBridge.saveFile(fileName, mime, utf8ToBase64(text));
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Save a data: URL (e.g. canvas PNG). */
export function saveDataUrl(fileName: string, dataUrl: string): void {
  if (nativeBridge) {
    const [head, b64] = dataUrl.split(',');
    const mime = head.replace(/^data:/, '').replace(/;base64$/, '') || 'application/octet-stream';
    nativeBridge.saveFile(fileName, mime, b64);
    return;
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Keep Android status/navigation bar colours in sync with the in-app theme.
if (nativeBridge && typeof document !== 'undefined') {
  const update = () => {
    try {
      nativeBridge.setDarkSystemBars(document.documentElement.classList.contains('dark'));
    } catch {
      /* ignore */
    }
  };
  new MutationObserver(update).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  update();
}
