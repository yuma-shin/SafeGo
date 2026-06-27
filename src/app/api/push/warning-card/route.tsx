import { ImageResponse } from "next/og";

export const runtime = "edge";

const LEVEL_COLOR: Record<string, string> = {
  "special-warning": "#dc2626",
  "critical-warning": "#ef4444",
  "warning":          "#f97316",
  "advisory":         "#eab308",
  "none":             "#22c55e",
};

const LEVEL_EN: Record<string, string> = {
  "special-warning": "Special Warning",
  "critical-warning": "Danger Warning",
  "warning":          "Warning",
  "advisory":         "Advisory",
  "none":             "Clear",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const judgment    = searchParams.get("j")  ?? "commute-ok";
  const homeLevel   = searchParams.get("hl") ?? "none";
  const officeLevel = searchParams.get("ol") ?? "none";

  const isAlert   = judgment === "stay-home";
  const accent    = isAlert ? "#ef4444" : "#22c55e";
  const bgAccent  = isAlert ? "#450a0a" : "#052e16";
  const titleText = isAlert ? "STAY HOME" : "COMMUTE OK";
  const icon      = isAlert ? "⚠️" : "✅";

  const homeColor   = LEVEL_COLOR[homeLevel]   ?? "#22c55e";
  const officeColor = LEVEL_COLOR[officeLevel] ?? "#22c55e";
  const homeEn      = LEVEL_EN[homeLevel]      ?? homeLevel;
  const officeEn    = LEVEL_EN[officeLevel]    ?? officeLevel;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0f172a",
          borderLeft: `8px solid ${accent}`,
        }}
      >
        {/* アイコンエリア */}
        <div
          style={{
            width: "90px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: bgAccent,
            fontSize: "44px",
          }}
        >
          {icon}
        </div>

        {/* コンテンツ */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "14px 18px",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "24px",
              fontWeight: 700,
              color: accent,
              letterSpacing: "0.05em",
            }}
          >
            {titleText}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "flex",
                  color: "#64748b",
                  fontSize: "12px",
                  width: "42px",
                  fontWeight: 600,
                }}
              >
                HOME
              </span>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  height: "6px",
                  backgroundColor: homeColor,
                  borderRadius: "3px",
                }}
              />
              <span
                style={{
                  display: "flex",
                  color: homeColor,
                  fontSize: "12px",
                  width: "105px",
                  fontWeight: 600,
                }}
              >
                {homeEn}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "flex",
                  color: "#64748b",
                  fontSize: "12px",
                  width: "42px",
                  fontWeight: 600,
                }}
              >
                WORK
              </span>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  height: "6px",
                  backgroundColor: officeColor,
                  borderRadius: "3px",
                }}
              />
              <span
                style={{
                  display: "flex",
                  color: officeColor,
                  fontSize: "12px",
                  width: "105px",
                  fontWeight: 600,
                }}
              >
                {officeEn}
              </span>
            </div>
          </div>
        </div>

        {/* SafeGo ブランディング */}
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
              fontSize: "13px",
              fontWeight: 700,
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
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    }
  );
}
