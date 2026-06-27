"use client";

import { useEffect, useRef, useState } from "react";
import type { PushPermissionState } from "@/types/push";
import type { AreaEntry } from "@/types/jma";

const REGISTERED_LOCATION_KEY = "push_registered_location";

function loadRegisteredLocation(): { home: AreaEntry | null; office: AreaEntry | null } {
  try {
    const raw = localStorage.getItem(REGISTERED_LOCATION_KEY);
    return raw ? JSON.parse(raw) : { home: null, office: null };
  } catch {
    return { home: null, office: null };
  }
}

interface PushNotificationState {
  permission: PushPermissionState;
  isLoading: boolean;
  errorMessage: string | null;
  registeredHome: AreaEntry | null;
  registeredOffice: AreaEntry | null;
}

interface UsePushNotificationReturn {
  state: PushNotificationState;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function usePushNotification(
  home: AreaEntry | null,
  office: AreaEntry | null
): UsePushNotificationReturn {
  const [state, setState] = useState<PushNotificationState>({
    permission: "default",
    isLoading: false,
    errorMessage: null,
    registeredHome: null,
    registeredOffice: null,
  });

  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const subscriptionRef = useRef<PushSubscription | null>(null);
  const subscribeRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState((prev) => ({ ...prev, permission: "unsupported" }));
      return;
    }

    const notifPermission = Notification.permission;
    if (notifPermission === "denied") {
      setState((prev) => ({ ...prev, permission: "denied" }));
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(async (registration) => {
        swRegistrationRef.current = registration;
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          subscriptionRef.current = existingSub;
          const { home: regHome, office: regOffice } = loadRegisteredLocation();
          setState((prev) => ({
            ...prev,
            permission: "subscribed",
            registeredHome: regHome,
            registeredOffice: regOffice,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            permission: notifPermission === "granted" ? "granted" : "default",
          }));
        }
      })
      .catch((err) => {
        console.error("[usePushNotification] SW 登録失敗:", err);
        setState((prev) => ({
          ...prev,
          permission: "unsupported",
          errorMessage: "Service Worker の登録に失敗しました",
        }));
      });
  }, []);


  async function subscribe(): Promise<void> {
    if (!home && !office) {
      setState((prev) => ({
        ...prev,
        errorMessage: "自宅または勤務地の地域を設定してください",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, errorMessage: null }));

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          permission: "denied",
        }));
        return;
      }

      const registration = swRegistrationRef.current;
      if (!registration) throw new Error("Service Worker が登録されていません");

      const pushSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });
      subscriptionRef.current = pushSub;

      const subJson = pushSub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys?.p256dh ?? "",
              auth: subJson.keys?.auth ?? "",
            },
          },
          homeOfficeCode: home?.officeCode ?? null,
          homeCityCode: home?.cityCode ?? null,
          officeOfficeCode: office?.officeCode ?? null,
          officeCityCode: office?.cityCode ?? null,
        }),
      });

      if (!res.ok) throw new Error(`サーバーエラー: ${res.status}`);

      localStorage.setItem(REGISTERED_LOCATION_KEY, JSON.stringify({ home, office }));

      setState((prev) => ({
        ...prev,
        isLoading: false,
        permission: "subscribed",
        registeredHome: home,
        registeredOffice: office,
      }));
    } catch (err) {
      console.error("[usePushNotification] 購読エラー:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        errorMessage: err instanceof Error ? err.message : "通知の有効化に失敗しました",
      }));
    }
  }

  subscribeRef.current = subscribe;

  async function unsubscribe(): Promise<void> {
    setState((prev) => ({ ...prev, isLoading: true, errorMessage: null }));

    try {
      const pushSub = subscriptionRef.current;
      if (pushSub) {
        const endpoint = pushSub.endpoint;
        await pushSub.unsubscribe();
        subscriptionRef.current = null;

        await fetch("/api/push/unsubscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }

      localStorage.removeItem(REGISTERED_LOCATION_KEY);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        permission: "default",
        registeredHome: null,
        registeredOffice: null,
      }));
    } catch (err) {
      console.error("[usePushNotification] 解除エラー:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        errorMessage: err instanceof Error ? err.message : "通知の解除に失敗しました",
      }));
    }
  }

  return { state, subscribe, unsubscribe };
}
