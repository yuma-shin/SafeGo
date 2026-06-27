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

interface BuildPayloadOptions {
  homeCityName?: string | null;
  officeCityName?: string | null;
}

export function buildPayload(
  judgment: JudgmentResult,
  homeAlertLevel: AlertLevel = "none",
  officeAlertLevel: AlertLevel = "none",
  activeWarningNames: string[] = [],
  options: BuildPayloadOptions = {}
): NotificationPayload {
  const { homeCityName, officeCityName } = options;
  const title = JUDGMENT_TITLES[judgment];

  const homeLabel = homeCityName ? `自宅（${homeCityName}）` : "自宅";
  const officeLabel = officeCityName ? `勤務地（${officeCityName}）` : "勤務地";

  let body: string;
  if (judgment === "stay-home") {
    const parts: string[] = [];
    if (homeAlertLevel !== "none") {
      const names = activeWarningNames.filter((_, i) => i < 3);
      parts.push(`${homeLabel}: ${names.length > 0 ? names.join("・") : ALERT_LEVEL_LABELS[homeAlertLevel]}`);
    }
    if (officeAlertLevel !== "none" && (homeCityName !== officeCityName || homeAlertLevel === "none")) {
      parts.push(`${officeLabel}: ${ALERT_LEVEL_LABELS[officeAlertLevel]}`);
    }
    body = parts.length > 0 ? parts.join(" ／ ") : `自宅または勤務地に${ALERT_LEVEL_LABELS[homeAlertLevel !== "none" ? homeAlertLevel : officeAlertLevel]}が発令中です`;
  } else {
    const homePart = `${homeLabel}: ${ALERT_LEVEL_LABELS[homeAlertLevel]}`;
    const officePart = `${officeLabel}: ${ALERT_LEVEL_LABELS[officeAlertLevel]}`;
    body = `${homePart} ／ ${officePart}`;
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
