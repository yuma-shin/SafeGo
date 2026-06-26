import { NextRequest, NextResponse } from "next/server";
import { deleteSubscription, generateSubscriptionId } from "@/lib/kv";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストボディが不正です", code: "INVALID_PARAMS" },
      { status: 400 }
    );
  }

  if (!body.endpoint) {
    return NextResponse.json(
      { error: "endpoint は必須です", code: "INVALID_PARAMS" },
      { status: 400 }
    );
  }

  const id = generateSubscriptionId(body.endpoint);

  try {
    await deleteSubscription(id);
  } catch (err) {
    console.error("[unsubscribe] KV 削除エラー:", err);
    return NextResponse.json(
      { error: "サブスクリプションの削除に失敗しました", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
