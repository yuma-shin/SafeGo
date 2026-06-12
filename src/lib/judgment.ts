import type { AlertLevel, JudgmentResult, JMAWarningItem } from "@/types/jma";

// /r8/ API コード体系（Qiita conqueror 記事準拠）
const SPECIAL_WARNING_CODES = new Set([
  "32", "33", "35", "36", "37", "38", "39", // 特別警報 + 土砂災害特別警報
]);
// 危険警報(43,48,49)・暴風警報(05)・高潮警報(08): 外出が著しく困難 → 自宅待機
const CRITICAL_WARNING_CODES = new Set(["05", "08", "43", "48", "49"]);
const WARNING_CODES = new Set(["02", "03", "04", "06", "07", "09"]);
const INACTIVE_STATUSES = new Set(["解除", "発表警報・注意報はなし"]);

// /r8/ API のコード → 名称マッピング（Qiita conqueror 記事準拠）
const WARNING_NAMES: Record<string, string> = {
  "02": "暴風雪警報",
  "03": "大雨警報",
  "04": "洪水警報",
  "05": "暴風警報",
  "06": "大雪警報",
  "07": "波浪警報",
  "08": "高潮警報",
  "09": "土砂災害警報",
  "10": "大雨注意報",
  "12": "大雪注意報",
  "13": "風雪注意報",
  "14": "雷注意報",
  "15": "強風注意報",
  "16": "波浪注意報",
  "17": "融雪注意報",
  "18": "洪水注意報",
  "19": "高潮注意報",
  "20": "濃霧注意報",
  "21": "乾燥注意報",
  "22": "なだれ注意報",
  "23": "低温注意報",
  "24": "霜注意報",
  "25": "着氷注意報",
  "26": "着雪注意報",
  "29": "土砂災害注意報",
  "32": "暴風雪特別警報",
  "33": "大雨特別警報",
  "35": "暴風特別警報",
  "36": "大雪特別警報",
  "37": "波浪特別警報",
  "38": "高潮特別警報",
  "39": "土砂災害特別警報",
  "43": "大雨危険警報",
  "48": "高潮危険警報",
  "49": "土砂災害危険警報",
};

export function isActiveWarning(status: string): boolean {
  return !INACTIVE_STATUSES.has(status);
}

export function classifyAlertLevel(warnings: JMAWarningItem[]): AlertLevel {
  const active = warnings.filter((w) => isActiveWarning(w.status));

  if (active.some((w) => SPECIAL_WARNING_CODES.has(w.code))) {
    return "special-warning";
  }
  if (active.some((w) => CRITICAL_WARNING_CODES.has(w.code))) {
    return "critical-warning";
  }
  if (active.some((w) => WARNING_CODES.has(w.code))) {
    return "warning";
  }
  if (active.length > 0) {
    return "advisory";
  }
  return "none";
}

export function makeJudgment(
  home: AlertLevel,
  office: AlertLevel
): JudgmentResult {
  // 特別警報・特定警報が1つでもあれば最優先で自宅待機
  if (
    home === "special-warning" ||
    office === "special-warning" ||
    home === "critical-warning" ||
    office === "critical-warning"
  ) {
    return "stay-home";
  }
  // 警報があれば在宅勤務推奨
  if (home === "warning" || office === "warning") {
    return "telework";
  }
  // 注意報以下はすべて通常出社可能
  return "commute-ok";
}

export function getWarningName(code: string): string {
  return WARNING_NAMES[code] ?? `警報・注意報(${code})`;
}
