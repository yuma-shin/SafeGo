import type { AlertLevel, JudgmentResult, JMAWarningItem } from "@/types/jma";
import type { StayHomeCondition } from "@/types/push";

// /r8/ API コード体系（気象庁 警戒レベル相当情報 / 警報・注意報 の 2 カテゴリに対応）
// 特別警報（警戒レベル5相当）
const SPECIAL_WARNING_CODES = new Set([
  "32", "33", "35", "36", "37", "38", "39",
]);
// 危険警報（警戒レベル4相当: 大雨危険警報・高潮危険警報・土砂災害危険警報）
const CRITICAL_WARNING_CODES = new Set(["43", "48", "49"]);
// 警報（警報・注意報カテゴリの警報: 暴風・暴風雪を含む全警報コード）
const WARNING_CODES = new Set(["02", "03", "04", "05", "06", "07", "08", "09"]);
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
  // 警戒レベル4以上（危険警報・特別警報）または警報・注意報カテゴリの警報以上 → 自宅待機
  const stayHomeLevel: AlertLevel[] = ["special-warning", "critical-warning", "warning"];
  if (stayHomeLevel.includes(home) || stayHomeLevel.includes(office)) {
    return "stay-home";
  }
  // 注意報以下はすべて通常出社可能
  return "commute-ok";
}

export function getWarningName(code: string): string {
  return WARNING_NAMES[code] ?? `警報・注意報(${code})`;
}

/** 警戒レベルの昇順配列。indexOf で大小比較に使用 */
export const ALERT_LEVEL_ORDER: readonly AlertLevel[] = [
  "none",
  "advisory",
  "warning",
  "critical-warning",
  "special-warning",
] as const;

/** JMA /r8/ API で使用される全有効警報コードのセット */
export const VALID_WARNING_CODES: ReadonlySet<string> = new Set(Object.keys(WARNING_NAMES));

export function isLevelAtLeast(level: AlertLevel, threshold: AlertLevel): boolean {
  const li = ALERT_LEVEL_ORDER.indexOf(level);
  const ti = ALERT_LEVEL_ORDER.indexOf(threshold);
  if (li === -1 || ti === -1) return false;
  return li >= ti;
}

export function makeJudgmentWithCondition(
  home: AlertLevel,
  office: AlertLevel,
  condition: StayHomeCondition | null,
  homeItems: JMAWarningItem[],
  officeItems: JMAWarningItem[]
): JudgmentResult {
  if (!condition) return makeJudgment(home, office);

  if (condition.levelThreshold) {
    if (
      isLevelAtLeast(home, condition.levelThreshold) ||
      isLevelAtLeast(office, condition.levelThreshold)
    ) {
      return "stay-home";
    }
  }

  if (condition.warningCodes && condition.warningCodes.length > 0) {
    const codes = new Set(condition.warningCodes);
    const allItems = [...homeItems, ...officeItems];
    if (allItems.some((item) => isActiveWarning(item.status) && codes.has(item.code))) {
      return "stay-home";
    }
  }

  return "commute-ok";
}
