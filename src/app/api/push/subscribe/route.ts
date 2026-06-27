import { NextRequest, NextResponse } from "next/server";
import {
  saveSubscription,
  generateSubscriptionId,
} from "@/lib/kv";
import { ALERT_LEVEL_ORDER, VALID_WARNING_CODES } from "@/lib/judgment";
import type { SubscribeRequest, StoredSubscription, StayHomeCondition } from "@/types/push";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Partial<SubscribeRequest>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストボディが不正です", code: "INVALID_PARAMS" },
      { status: 400 }
    );
  }

  const { subscription, homeOfficeCode, homeCityCode, homeCityName, officeOfficeCode, officeCityCode, officeCityName, stayHomeCondition: rawCondition } = body;

  if (
    !subscription?.endpoint ||
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    return NextResponse.json(
      { error: "必須フィールドが不足しています", code: "INVALID_PARAMS" },
      { status: 400 }
    );
  }

  if (!subscription.endpoint.startsWith("https://")) {
    return NextResponse.json(
      { error: "endpoint は https:// で始まる必要があります", code: "INVALID_PARAMS" },
      { status: 400 }
    );
  }

  // 自宅・勤務地のどちらか一方は必須
  if (!homeOfficeCode && !officeOfficeCode) {
    return NextResponse.json(
      { error: "自宅または勤務地のいずれかを設定してください", code: "INVALID_PARAMS" },
      { status: 400 }
    );
  }

  if (homeOfficeCode && !/^\d{6}$/.test(homeOfficeCode)) {
    return NextResponse.json(
      { error: "homeOfficeCode は6桁の数字でなければなりません", code: "INVALID_PARAMS" },
      { status: 400 }
    );
  }

  if (officeOfficeCode && !/^\d{6}$/.test(officeOfficeCode)) {
    return NextResponse.json(
      { error: "officeOfficeCode は6桁の数字でなければなりません", code: "INVALID_PARAMS" },
      { status: 400 }
    );
  }

  // stayHomeCondition バリデーション
  let stayHomeCondition: StayHomeCondition | null = null;
  if (rawCondition) {
    if (rawCondition.levelThreshold !== undefined) {
      const validThresholds = ALERT_LEVEL_ORDER.filter((l) => l !== "none");
      if (!validThresholds.includes(rawCondition.levelThreshold as never)) {
        return NextResponse.json(
          { error: "stayHomeCondition.levelThreshold が無効な値です", code: "INVALID_PARAMS" },
          { status: 400 }
        );
      }
    }
    if (rawCondition.warningCodes !== undefined && rawCondition.warningCodes.length > 0) {
      const invalidCodes = rawCondition.warningCodes.filter((c) => !VALID_WARNING_CODES.has(c));
      if (invalidCodes.length > 0) {
        return NextResponse.json(
          {
            error: `stayHomeCondition.warningCodes に無効なコードが含まれています: ${invalidCodes.join(", ")}`,
            code: "INVALID_PARAMS",
          },
          { status: 400 }
        );
      }
    }
    const hasLevel = rawCondition.levelThreshold !== undefined;
    const hasCodes = rawCondition.warningCodes !== undefined && rawCondition.warningCodes.length > 0;
    if (hasLevel || hasCodes) {
      stayHomeCondition = rawCondition as StayHomeCondition;
    }
  }

  const id = generateSubscriptionId(subscription.endpoint);
  const data: StoredSubscription = {
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    homeOfficeCode: homeOfficeCode ?? null,
    homeCityCode: homeCityCode ?? null,
    homeCityName: homeCityName ?? null,
    officeOfficeCode: officeOfficeCode ?? null,
    officeCityCode: officeCityCode ?? null,
    officeCityName: officeCityName ?? null,
    lastJudgment: null,
    registeredAt: new Date().toISOString(),
    lastSuccessAt: null,
    stayHomeCondition,
  };

  try {
    await saveSubscription(id, data);
  } catch (err) {
    console.error("[subscribe] KV 保存エラー:", err);
    return NextResponse.json(
      { error: "サブスクリプションの保存に失敗しました", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
