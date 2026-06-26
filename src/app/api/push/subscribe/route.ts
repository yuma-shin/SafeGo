import { NextRequest, NextResponse } from "next/server";
import {
  saveSubscription,
  generateSubscriptionId,
} from "@/lib/kv";
import type { SubscribeRequest, StoredSubscription } from "@/types/push";

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

  const { subscription, homeOfficeCode, homeCityCode, officeOfficeCode, officeCityCode } = body;

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

  const id = generateSubscriptionId(subscription.endpoint);
  const data: StoredSubscription = {
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    homeOfficeCode: homeOfficeCode ?? null,
    homeCityCode: homeCityCode ?? null,
    officeOfficeCode: officeOfficeCode ?? null,
    officeCityCode: officeCityCode ?? null,
    lastJudgment: null,
    registeredAt: new Date().toISOString(),
    lastSuccessAt: null,
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
