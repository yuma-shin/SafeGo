import webPush from "web-push";
import type { AlertLevel, JudgmentResult } from "@/types/jma";
import type { StoredSubscription, NotificationPayload } from "@/types/push";

const JUDGMENT_TITLES: Record<JudgmentResult, string> = {
  "stay-home": "自宅待機",
  "commute-ok": "出社可能",
};

const ALERT_LEVEL_LABELS: Record<AlertLevel, string> = {
  "special-warning": "特別警報",
  "critical-warning": "危険警報",
  "warning": "警報",
  "advisory": "注意報",
  "none": "警報なし",
};

export type PushSendResult =
  | { ok: true }
  | { ok: false; gone: true }
  | { ok: false; gone: false; error: string };

export function buildPayload(
  judgment: JudgmentResult,
  homeAlertLevel: AlertLevel = "none",
  officeAlertLevel: AlertLevel = "none",
  activeWarningNames: string[] = []
): NotificationPayload {
  const title = JUDGMENT_TITLES[judgment];
  let body: string;

  if (judgment === "stay-home") {
    body = activeWarningNames.length > 0
      ? `発令中: ${activeWarningNames.join("・")}`
      : `自宅または勤務地に${ALERT_LEVEL_LABELS[homeAlertLevel] !== "警報なし" ? ALERT_LEVEL_LABELS[homeAlertLevel] : ALERT_LEVEL_LABELS[officeAlertLevel]}が発令中です`;
  } else {
    body = "自宅: 警報なし / 勤務地: 警報なし";
  }

  return {
    title,
    body,
    icon: "/icons/icon-192.svg",
    data: {
      url: "/",
      judgment,
    },
  };
}

export async function sendNotification(
  sub: StoredSubscription,
  payload: NotificationPayload
): Promise<PushSendResult> {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
    process.env.VAPID_PRIVATE_KEY ?? ""
  );

  try {
    await webPush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 410) {
      return { ok: false, gone: true };
    }
    return {
      ok: false,
      gone: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
