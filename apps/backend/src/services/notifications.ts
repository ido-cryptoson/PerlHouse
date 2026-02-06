import webPush from 'web-push';
import { Member, PushSubscriptionRecord } from '../types';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? '';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webPush.setVapidDetails('mailto:admin@bayit.app', VAPID_PUBLIC, VAPID_PRIVATE);
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(sub: PushSubscriptionRecord, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) { console.warn('[Push] VAPID not configured'); return; }
  try {
    await webPush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload), { TTL: 3600 });
  } catch (error: unknown) {
    const code = (error as { statusCode?: number }).statusCode;
    if (code === 410 || code === 404) console.warn('[Push] Subscription expired');
    else console.error('[Push] Error:', error);
  }
}

export async function notifyHouseholdMembers(members: Member[], payload: PushPayload): Promise<void> {
  const promises: Promise<void>[] = [];
  for (const member of members) {
    if (member.push_subscription) {
      promises.push(sendPushNotification(member.push_subscription, payload));
    }
  }
  await Promise.allSettled(promises);
}
