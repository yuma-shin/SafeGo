import { NextRequest, NextResponse } from "next/server";
import {
  getAllSubscriptions,
  deleteSubscription,
  updateLastJudgment,
  pruneStaleSubscriptions,
} from "@/lib/kv";
import { buildPayload, sendNotification } from "@/lib/push";
import { fetchJMAWarning } from "@/lib/jma";
import {
  classifyAlertLevel,
  makeJudgment,
  getWarningName,
  isActiveWarning,
} from "@/lib/judgment";
import type { JMAWarningData } from "@/types/jma";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 期限切れ Subscription を削除
  try {
    await pruneStaleSubscriptions();
  } catch (err) {
    console.error("[cron/notify] prune エラー:", err);
  }

  const subscriptions = await getAllSubscriptions();
  if (subscriptions.length === 0) {
    return NextResponse.json({ processed: 0, notified: 0, errors: 0 });
  }

  // 同一 officeCode の JMA データをキャッシュ
  const jmaCache = new Map<string, JMAWarningData>();

  async function fetchWithCache(officeCode: string): Promise<JMAWarningData | null> {
    if (jmaCache.has(officeCode)) return jmaCache.get(officeCode)!;
    try {
      const data = await fetchJMAWarning(officeCode);
      jmaCache.set(officeCode, data);
      return data;
    } catch (err) {
      console.error(`[cron/notify] JMA fetch エラー officeCode=${officeCode}:`, err);
      return null;
    }
  }

  function getActiveWarningNames(data: JMAWarningData, cityCode: string): string[] {
    const area = data.warning?.class20Items?.find((a) => a.areaCode === cityCode);
    if (!area) return [];
    return area.kinds
      .filter((k) => isActiveWarning(k.status))
      .map((k) => getWarningName(k.code));
  }

  function getWarningItems(data: JMAWarningData, cityCode: string) {
    const area = data.warning?.class20Items?.find((a) => a.areaCode === cityCode);
    if (!area) return [];
    return area.kinds.map((k) => ({ code: k.code, status: k.status }));
  }

  let processed = 0;
  let notified = 0;
  let errors = 0;

  for (const { id, data: sub } of subscriptions) {
    processed++;
    try {
      const [homeData, officeData] = await Promise.all([
        sub.homeOfficeCode ? fetchWithCache(sub.homeOfficeCode) : Promise.resolve(null),
        sub.officeOfficeCode ? fetchWithCache(sub.officeOfficeCode) : Promise.resolve(null),
      ]);

      if (!homeData && !officeData) {
        errors++;
        continue;
      }

      const homeItems = sub.homeCityCode && homeData
        ? getWarningItems(homeData, sub.homeCityCode)
        : [];
      const officeItems = sub.officeCityCode && officeData
        ? getWarningItems(officeData, sub.officeCityCode)
        : [];

      const homeAlertLevel = classifyAlertLevel(homeItems);
      const officeAlertLevel = classifyAlertLevel(officeItems);
      const currentJudgment = makeJudgment(homeAlertLevel, officeAlertLevel);

      if (currentJudgment === sub.lastJudgment) continue;

      const activeWarningNames = [
        ...(sub.homeCityCode && homeData ? getActiveWarningNames(homeData, sub.homeCityCode) : []),
        ...(sub.officeCityCode && officeData ? getActiveWarningNames(officeData, sub.officeCityCode) : []),
      ];

      const payload = buildPayload(
        currentJudgment,
        homeAlertLevel,
        officeAlertLevel,
        activeWarningNames,
        {
          homeCityName: sub.homeCityName ?? null,
          officeCityName: sub.officeCityName ?? null,
        }
      );

      const result = await sendNotification(sub, payload);

      if (result.ok) {
        await updateLastJudgment(id, currentJudgment);
        notified++;
      } else if (result.gone) {
        console.info(`[cron/notify] HTTP 410: Subscription ${id} を削除`);
        await deleteSubscription(id);
        errors++;
      } else {
        console.error(`[cron/notify] 送信エラー: ${result.error}`);
        errors++;
      }
    } catch (err) {
      console.error(`[cron/notify] Subscription ${id} 処理エラー:`, err);
      errors++;
    }
  }

  return NextResponse.json({ processed, notified, errors });
}
