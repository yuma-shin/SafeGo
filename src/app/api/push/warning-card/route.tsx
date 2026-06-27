import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const LEVEL_LABELS: Record<string, string> = {
  "special-warning": "特別警報",
  "critical-warning": "危険警報",
  "warning": "警報",
  "advisory": "注意報",
  "none": "警報なし",
};

const LEVEL_COLORS: Record<string, string> = {
  "special-warning": "#dc2626",
  "critical-warning": "#ef4444",
  "warning": "#f97316",
  "advisory": "#eab308",
  "none": "#22c55e",
};

async function loadJapaneseFont(): Promise<ArrayBuffer | null> {
  try {
    // Google Fonts CSS API からフォント URL を取得
    const cssRes = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      }
    );
    const css = await cssRes.text();
    const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
    if (!match) return null;
    return fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const judgment = searchParams.get("j") ?? "commute-ok";
  const homeLevel = searchParams.get("hl") ?? "none";
  const officeLevel = searchParams.get("ol") ?? "none";
  const homeCity = searchParams.get("hc") ?? "";
  const officeCity = searchParams.get("oc") ?? "";

  const isAlert = judgment === "stay-home";
  const accent = isAlert ? "#ef4444" : "#22c55e";
  const accentMuted = isAlert ? "#7f1d1d" : "#14532d";
  const badgeText = isAlert ? "⚠ 自宅待機" : "✓ 出社可能";
  const badgeColor = isAlert ? "#fca5a5" : "#86efac";

  const fontData = await loadJapaneseFont();
  const fonts = fontData
    ? [
        {
          name: "NotoSansJP",
          data: fontData,
          weight: 700 as const,
          style: "normal" as const,
        },
      ]
    : [];
  const fontFamily = fontData ? "NotoSansJP, sans-serif" : "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0f172a",
          padding: "20px 24px",
          fontFamily,
        }}
      >
        {/* ヘッダー：バッジ + SafeGo ロゴ */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: accentMuted,
              border: `1.5px solid ${accent}`,
              borderRadius: "8px",
              padding: "5px 14px",
              color: badgeColor,
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            {badgeText}
          </div>
          <div
            style={{
              marginLeft: "auto",
              color: "#38bdf8",
              fontSize: "15px",
              fontWeight: 700,
              display: "flex",
            }}
          >
            SafeGo
          </div>
        </div>

        {/* 地域行 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {(homeCity || homeLevel !== "none") && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  minWidth: "44px",
                  display: "flex",
                }}
              >
                自宅
              </span>
              {homeCity && (
                <span
                  style={{
                    color: "#e2e8f0",
                    fontSize: "15px",
                    fontWeight: 600,
                    display: "flex",
                  }}
                >
                  {homeCity}
                </span>
              )}
              <span
                style={{
                  marginLeft: "auto",
                  color: LEVEL_COLORS[homeLevel] ?? "#64748b",
                  fontSize: "14px",
                  fontWeight: 700,
                  display: "flex",
                }}
              >
                {LEVEL_LABELS[homeLevel] ?? homeLevel}
              </span>
            </div>
          )}
          {(officeCity || officeLevel !== "none") && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  minWidth: "44px",
                  display: "flex",
                }}
              >
                勤務地
              </span>
              {officeCity && (
                <span
                  style={{
                    color: "#e2e8f0",
                    fontSize: "15px",
                    fontWeight: 600,
                    display: "flex",
                  }}
                >
                  {officeCity}
                </span>
              )}
              <span
                style={{
                  marginLeft: "auto",
                  color: LEVEL_COLORS[officeLevel] ?? "#64748b",
                  fontSize: "14px",
                  fontWeight: 700,
                  display: "flex",
                }}
              >
                {LEVEL_LABELS[officeLevel] ?? officeLevel}
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 480,
      height: 160,
      fonts,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    }
  );
}
