import { PriceAlert } from '../types/alerts';

export const ALERT_NAVIGATE_EVENT = 'quantpulse:navigate-to-asset';
export const IN_APP_ALERT_EVENT = 'quantpulse:in-app-alert';

export interface InAppAlertPayload {
  alert: PriceAlert;
  currentPrice: number;
  title: string;
  body: string;
  timestamp: string;
}

/**
 * Requests browser notification permission the first time the user creates an alert.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'default') {
    try {
      return await Notification.requestPermission();
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  return Notification.permission;
}

/**
 * Triggers a desktop browser notification and broadcasts an in-app toast event.
 */
export function triggerPriceAlertNotification(alert: PriceAlert, currentPrice: number): void {
  const directionText = alert.direction === 'ABOVE' ? 'superó' : 'cayó por debajo de';
  const formattedTarget = alert.targetPrice.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  const formattedCurrent = currentPrice.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  const title = `🎯 ${alert.symbol} alcanzó tu precio objetivo`;
  const body = `${alert.symbol} ${directionText} $${formattedTarget}. Precio actual: $${formattedCurrent}${
    alert.note ? ` — "${alert.note}"` : ''
  }`;

  // 1. Try Native Browser Notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `price-alert-${alert.id}`,
      });

      notif.onclick = () => {
        try {
          window.focus();
          window.dispatchEvent(
            new CustomEvent(ALERT_NAVIGATE_EVENT, {
              detail: {
                assetId: alert.assetId,
                symbol: alert.symbol,
                tab: 'chart',
              },
            })
          );
          notif.close();
        } catch (e) {}
      };
    } catch (err) {
      console.warn('Native notification failed, using in-app fallback', err);
    }
  }

  // 2. Always dispatch in-app event for visible toast banner inside app
  if (typeof window !== 'undefined') {
    const payload: InAppAlertPayload = {
      alert,
      currentPrice,
      title,
      body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    window.dispatchEvent(
      new CustomEvent(IN_APP_ALERT_EVENT, {
        detail: payload,
      })
    );
  }
}
