import type { AlertLevel, JudgmentResult } from "@/types/jma";

/** "none" を除いた警戒レベル（閾値として意味のある値のみ） */
export type AlertLevelThreshold = Exclude<AlertLevel, "none">;

/** ユーザーが指定する自宅待機の発動条件 */
export interface StayHomeCondition {
  levelThreshold?: AlertLevelThreshold;
  warningCodes?: string[];
}

/** ブラウザの通知許可状態 */
export type PushPermissionState =
  | "unsupported"  // Push API 非対応ブラウザ
  | "default"      // 未回答
  | "granted"      // 許可済み（未購読）
  | "subscribed"   // 許可済み・購読済み（サーバー保存完了）
  | "denied";      // 拒否済み

/** KV に保存する Subscription エントリ */
export interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  homeOfficeCode: string | null;
  homeCityCode: string | null;
  homeCityName: string | null;
  officeOfficeCode: string | null;
  officeCityCode: string | null;
  officeCityName: string | null;
  lastJudgment: JudgmentResult | null;
  registeredAt: string;        // ISO 8601
  lastSuccessAt: string | null; // ISO 8601
  stayHomeCondition: StayHomeCondition | null;
}

/** POST /api/push/subscribe リクエストボディ */
export interface SubscribeRequest {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  homeOfficeCode: string | null;
  homeCityCode: string | null;
  homeCityName: string | null;
  officeOfficeCode: string | null;
  officeCityCode: string | null;
  officeCityName: string | null;
  stayHomeCondition?: StayHomeCondition | null;
}

/** 通知ペイロード（Service Worker が受け取る JSON） */
export interface NotificationPayload {
  title: string;
  body: string;
  icon: string;
  data: {
    url: string;
    judgment: JudgmentResult;
  };
}
