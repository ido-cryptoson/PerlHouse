"use client";

import { useEffect, useRef } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useAuth } from "./useAuth";
import type { Json } from "@/types/database";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function usePushNotifications() {
  const { supabase } = useSupabase();
  const { member } = useAuth();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!member || subscribedRef.current) return;
    if (!VAPID_PUBLIC_KEY) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const subscribe = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();

        // Skip if already subscribed with same endpoint stored in DB
        if (existing && member.push_subscription) {
          const stored = member.push_subscription as { endpoint?: string };
          if (stored.endpoint === existing.endpoint) {
            subscribedRef.current = true;
            return;
          }
        }

        // Subscribe (reuse existing or create new)
        const subscription =
          existing ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          }));

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys) return;

        const record = {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh!, auth: json.keys.auth! },
        };

        await supabase
          .from("members")
          .update({ push_subscription: record as unknown as Json })
          .eq("id", member.id);

        subscribedRef.current = true;
      } catch (err) {
        console.error("[Push] Subscription failed:", err);
      }
    };

    subscribe();
  }, [member, supabase]);
}
