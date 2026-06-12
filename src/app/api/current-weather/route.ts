import { NextRequest, NextResponse } from "next/server";
import { fetchJMACurrentWeather } from "@/lib/weather";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const officeCode = request.nextUrl.searchParams.get("officeCode")?.trim();
  if (!officeCode) {
    return NextResponse.json(
      { error: "officeCode パラメータが必要です" },
      { status: 400 },
    );
  }

  const weather = await fetchJMACurrentWeather(officeCode);
  if (!weather) {
    return NextResponse.json(
      { error: "天気データを取得できませんでした" },
      { status: 503 },
    );
  }

  return NextResponse.json(weather, {
    headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=60" },
  });
}
