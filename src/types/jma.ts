// 警報レベル（特別警報 > 特定警報 > 警報 > 注意報 > なし）
// critical-warning: 暴風警報・高潮警報など外出困難な特定警報
export type AlertLevel =
  | "special-warning"
  | "critical-warning"
  | "warning"
  | "advisory"
  | "none";

// 出社可否判定
// stay-home:  警報以上・危険警報（警戒レベル4）以上 → 自宅待機
// commute-ok: 注意報・なし                          → 通常出社可能
export type JudgmentResult = "stay-home" | "commute-ok";

// エリアマスタエントリ（data/areas.json の各要素）
export interface AreaEntry {
  cityCode: string;    // class20s コード（7桁）
  cityName: string;    // 市区町村名
  kana: string;        // よみがな（検索用）
  officeCode: string;  // 警報API用コード（6桁）
  officeName: string;  // 都道府県名
}

// アクティブ警報 1件
export interface ActiveWarning {
  code: string;        // 警報コード
  name: string;        // 警報種別名
  status: string;      // JMA の status 文字列
  level: AlertLevel;   // 分類済みレベル
}

// 1拠点の警報状態
export interface LocationWarningState {
  location: AreaEntry;
  alerts: ActiveWarning[];
  alertLevel: AlertLevel;
  cachedAt: string;    // JMA の reportDatetime
  isStale: boolean;
  publishingOffice?: string;  // 気象台名（例: 東京管区気象台）
}

// API レスポンス型
export interface WarningResponse {
  alerts: ActiveWarning[];
  alertLevel: AlertLevel;
  cachedAt: string;
  isStale: boolean;
  publishingOffice?: string;  // 気象台名
}

export interface ErrorResponse {
  error: string;
  code: "INVALID_PARAMS" | "JMA_UNAVAILABLE" | "PARSE_ERROR";
  staleData?: WarningResponse;
}

// JMA API レスポンス型
// JMA Warning API (/r8/ エンドポイント) の型定義

// 各警報種別（kinds 配列の要素）
export interface JMAKindItem {
  code: string;
  status: string;
  additions?: string[];  // 追加情報（例: ["竜巻"]）
}

// 市区町村単位のエリアアイテム（class20Items の要素）
export interface JMAAreaItem {
  areaCode: string;
  kinds: JMAKindItem[];
}

// warning オブジェクト内の構造
export interface JMAWarningSection {
  class10Items?: JMAAreaItem[];  // 一次細分区域レベル
  class20Items?: JMAAreaItem[];  // 市区町村レベル
}

export interface JMAWarningData {
  reportDatetime: string;
  publishingOffice: string;
  headlineText: string;
  warning: JMAWarningSection;
  dataTypeCode?: string;  // 速報種別コード（VPWW55, VPWW56 等）
}

// judgment.ts 内で使用する正規化済み警報アイテム
export interface JMAWarningItem {
  code: string;
  status: string;
}

// 現在の気象情報（気象庁予報API + AMeDAS観測 から取得）
export interface CurrentWeather {
  weatherCode: string;    // 気象庁3桁天気コード（今日の予報）
  description: string;    // 天気説明（日本語）
  emoji: string;          // 天気絵文字
  temp: number | null;    // 現在気温 AMeDAS観測値 (°C)
  tempMin: number | null; // 明日予報最低気温 (°C)
  tempMax: number | null; // 明日予報最高気温 (°C)
}
