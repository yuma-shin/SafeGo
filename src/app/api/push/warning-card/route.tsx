import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// モジュール初期化時に1回だけ読み込む（以降はキャッシュ）
let fontData: ArrayBuffer | null = null;
try {
  const buf = fs.readFileSync(
    path.join(
      process.cwd(),
      "node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff2"
    )
  );
  fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
} catch {
  // フォントが読み込めない場合は英語フォールバック
}

const LEVEL_COLOR: Record<string, string> = {
  "special-warning": "#dc2626",
  "critical-warning": "#ef4444",
  "warning":          "#f97316",
  "advisory":         "#eab308",
  "none":             "#22c55e",
};

const LEVEL_JP: Record<string, string> = {
  "special-warning": "特別警報",
  "critical-warning": "危険警報",
  "warning":          "警報",
  "advisory":         "注意報",
  "none":             "警報なし",
};

const LEVEL_EN: Record<string, string> = {
  "special-warning": "Special Warn",
  "critical-warning": "Danger Warn",
  "warning":          "Warning",
  "advisory":         "Advisory",
  "none":             "Clear",
};

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const judgment    = searchParams.get("j")  ?? "commute-ok";
  const homeLevel   = searchParams.get("hl") ?? "none";
  const officeLevel = searchParams.get("ol") ?? "none";
  const homeCity    = searchParams.get("hc") ?? "";
  const officeCity  = searchParams.get("oc") ?? "";

  const isAlert    = judgment === "stay-home";
  const accent     = isAlert ? "#ef4444" : "#22c55e";
  const bgAccent   = isAlert ? "#7f1d1d" : "#14532d";
  const hasFont    = fontData !== null;
  const fontFamily = hasFont ? "NotoSansJP, sans-serif" : "sans-serif";

  const titleText  = hasFont ? (isAlert ? "自宅待機" : "出社可能") : (isAlert ? "STAY HOME" : "COMMUTE OK");
  const homeLabel  = hasFont ? "自宅" : "HOME";
  const workLabel  = hasFont ? "勤務地" : "WORK";
  const levelLabels = hasFont ? LEVEL_JP : LEVEL_EN;

  const homeColor   = LEVEL_COLOR[homeLevel]   ?? "#22c55e";
  const officeColor = LEVEL_COLOR[officeLevel] ?? "#22c55e";
  const homeText    = levelLabels[homeLevel]   ?? homeLevel;
  const officeText  = levelLabels[officeLevel] ?? officeLevel;

  const fonts = hasFont
    ? [{ name: "NotoSansJP", data: fontData!, weight: 700 as const, style: "normal" as const }]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0f172a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderLeft: `6px solid ${accent}`,
          fontFamily,
        }}
      >
        {/* 左：ステータスアイコン */}
        <div
          style={{
            width: "84px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: bgAccent,
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", fontSize: "32px" }}>
            {isAlert ? "⚠️" : "✅"}
          </div>
        </div>

        {/* 中央：コンテンツ */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "14px 16px",
            gap: "10px",
          }}
        >
          {/* タイトル */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                display: "flex",
                fontSize: "21px",
                fontWeight: 700,
                color: accent,
                letterSpacing: "0.02em",
              }}
            >
              {titleText}
            </span>
          </div>

          {/* HOME / WORK 行 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Home */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "flex",
                  color: "#64748b",
                  fontSize: "11px",
                  fontWeight: 600,
                  width: homeCity ? "28px" : "42px",
                  letterSpacing: "0.03em",
                }}
              >
                {homeLabel}
              </span>
              {homeCity && (
                <span
                  style={{
                    display: "flex",
                    color: "#cbd5e1",
                    fontSize: "13px",
                    fontWeight: 600,
                    maxWidth: "80px",
                  }}
                >
                  {homeCity}
                </span>
              )}
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  height: "5px",
                  backgroundColor: homeColor,
                  borderRadius: "3px",
                  opacity: 0.9,
                }}
              />
              <span
                style={{
                  display: "flex",
                  color: homeColor,
                  fontSize: "11px",
                  fontWeight: 700,
                  width: "62px",
                  textAlign: "right",
                }}
              >
                {homeText}
              </span>
            </div>
            {/* Office */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "flex",
                  color: "#64748b",
                  fontSize: "11px",
                  fontWeight: 600,
                  width: officeCity ? "28px" : "42px",
                  letterSpacing: "0.03em",
                }}
              >
                {workLabel}
              </span>
              {officeCity && (
                <span
                  style={{
                    display: "flex",
                    color: "#cbd5e1",
                    fontSize: "13px",
                    fontWeight: 600,
                    maxWidth: "80px",
                  }}
                >
                  {officeCity}
                </span>
              )}
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  height: "5px",
                  backgroundColor: officeColor,
                  borderRadius: "3px",
                  opacity: 0.9,
                }}
              />
              <span
                style={{
                  display: "flex",
                  color: officeColor,
                  fontSize: "11px",
                  fontWeight: 700,
                  width: "62px",
                  textAlign: "right",
                }}
              >
                {officeText}
              </span>
            </div>
          </div>
        </div>

        {/* 右：ブランド */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: "8px 12px",
          }}
        >
          <span
            style={{
              display: "flex",
              color: "#38bdf8",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            SafeGo
          </span>
        </div>
      </div>
    ),
    {
      width: 480,
      height: 160,
      fonts,
      headers: {
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    }
  );
}
