import { NextRequest, NextResponse } from "next/server";
import { fetchJMAWarning, JMAFetchError } from "@/lib/jma";
import { classifyAlertLevel, isActiveWarning, getWarningName } from "@/lib/judgment";
import type {
  ActiveWarning,
  AlertLevel,
  ErrorResponse,
  JMAWarningItem,
  WarningResponse,
} from "@/types/jma";

function isValidCode(value: string | null, digits: number): boolean {
  if (!value) return false;
  return new RegExp(`^\\d{${digits}}$`).test(value);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const officeCode = searchParams.get("officeCode");
  const cityCode = searchParams.get("cityCode");

  if (!isValidCode(officeCode, 6) || !isValidCode(cityCode, 7)) {
    return NextResponse.json<ErrorResponse>(
      { error: "Invalid parameters", code: "INVALID_PARAMS" },
      { status: 400 }
    );
  }

  let warningData;
  try {
    warningData = await fetchJMAWarning(officeCode!);
  } catch (err) {
    if (err instanceof JMAFetchError) {
      return NextResponse.json<ErrorResponse>(
        { error: "JMA API is unavailable", code: "JMA_UNAVAILABLE" },
        { status: 502 }
      );
    }
    return NextResponse.json<ErrorResponse>(
      { error: "Parse error", code: "PARSE_ERROR" },
      { status: 500 }
    );
  }

  // class20Items から市区町村コードで対象エリアを取得
  const class20Items = warningData.warning?.class20Items ?? [];
  const targetArea = class20Items.find((a) => a.areaCode === cityCode);

  const rawWarnings: JMAWarningItem[] = (targetArea?.kinds ?? []).map((k) => ({
    code: k.code,
    status: k.status,
  }));
  const alerts: ActiveWarning[] = rawWarnings.map((w) => ({
    code: w.code,
    name: getWarningName(w.code),
    status: w.status,
    level: classifyAlertLevel([w]) as AlertLevel,
  }));

  const alertLevel = classifyAlertLevel(
    rawWarnings.filter((w) => isActiveWarning(w.status))
  );

  const body: WarningResponse = {
    alerts,
    alertLevel,
    cachedAt: warningData.reportDatetime,
    isStale: false,
    publishingOffice: warningData.publishingOffice,
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Cache-Control": "s-maxage=600, stale-while-revalidate=60",
    },
  });
}
