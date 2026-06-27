# SafeGo

**SafeGo** は、気象庁の警報・注意報データをもとに「今日の出社は大丈夫？」を即座に判定するシングルページ Web アプリです。自宅と勤務地の2拠点を市区町村単位で設定するだけで、カラーバナーでひと目で出社可否がわかります。

---

## 主な機能

| 機能                | 説明                                                                            |
| ------------------- | ------------------------------------------------------------------------------- |
| 地域設定            | 自宅・勤務地を市区町村単位でオートコンプリート入力                              |
| 警報取得            | 気象庁 bosai/warning API から最新の警報・注意報を取得                           |
| 出社判定            | 特別警報・警報 → 「自宅待機」、注意報 → 「テレワーク推奨」、なし → 「出社可能」 |
| 現在気温・天気      | AMeDAS観測値による現在気温と天気予報（概況・最高最低気温）を表示                |
| 都道府県シルエット  | カード背景に都道府県の地形シルエットをアスペクト比正確に表示                    |
| プッシュ通知        | 気象状況が変化したとき（10分ごと）にブラウザ通知を送信（PWA対応、cron-job.org で定期実行） |
| キャッシュ制御      | APIへの過剰リクエストを防ぐ2層キャッシュ（最大10分に1回）                       |
| 設定の永続化        | localStorage により地域設定・テーマをリロード後も保持                           |
| ライト/ダークモード | OSの設定に連動し、手動切り替えも可能                                            |
| レスポンシブ        | スマートフォン（320px〜）・タブレット・デスクトップに対応                       |

---

## 出社可否ロジック

```
自宅または勤務地に 特別警報 or 警報 → 自宅待機を推奨
自宅または勤務地に 注意報のみ         → テレワーク推奨
どちらにも警報・注意報なし             → 出社可能
```

---

## 技術スタック

| レイヤー       | 技術                                       |
| -------------- | ------------------------------------------ |
| フレームワーク | Next.js 16 (App Router) + React 19         |
| 言語           | TypeScript 5 (strict モード)               |
| スタイル       | Tailwind CSS v3 (darkMode: "class")        |
| 外部 API       | 気象庁 bosai API（警報・天気予報・AMeDAS） |
| プッシュ通知   | Web Push API + VAPID（web-push）           |
| データストア   | Redis（ioredis 経由、Vercel KV 推奨）      |
| テスト         | Jest 29 + React Testing Library            |
| ホスティング   | Vercel（推奨）                             |

---

## セットアップ

### 必要環境

- Node.js 20+
- npm 10+

### インストール & 起動

```bash
# 依存パッケージをインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 環境変数

`.env.local.example` をコピーして `.env.local` を作成し、各値を設定してください。

```bash
cp .env.local.example .env.local
```

| 変数名                         | 説明                                                     |
| ------------------------------ | -------------------------------------------------------- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID 公開鍵（下記コマンドで生成）                       |
| `VAPID_PRIVATE_KEY`            | VAPID 秘密鍵                                             |
| `VAPID_SUBJECT`                | Push サービス連絡先（`mailto:you@example.com` 形式）     |
| `REDIS_URL`                    | Redis 接続 URL（Vercel KV ダッシュボードからコピー）     |
| `CRON_SECRET`                  | Cron 認証トークン（任意の強力なランダム文字列）          |

**VAPID 鍵の生成:**

```bash
npx web-push generate-vapid-keys
```

### テスト実行

```bash
# 全テストを実行
npm test

# ウォッチモード
npm run test:watch
```

### プロダクションビルド

```bash
npm run build
npm start
```

---

## プロジェクト構成

```
src/
├── app/
│   ├── layout.tsx               # ルートレイアウト（ダークモードフラッシュ防止）
│   ├── page.tsx                 # メインページ（状態管理・UI統合）
│   ├── manifest.ts              # PWA マニフェスト
│   ├── globals.css              # CSS カスタムプロパティ（ライト/ダーク両テーマ）
│   └── api/
│       ├── weather/route.ts     # 警報・注意報 API プロキシ
│       ├── current-weather/
│       │   └── route.ts         # 現在気温・天気 API プロキシ
│       ├── push/
│       │   ├── subscribe/route.ts    # Push 購読登録
│       │   └── unsubscribe/route.ts  # Push 購読解除
│       └── cron/
│           └── notify/route.ts  # Cron 通知送信（GitHub Actions から呼び出し）
├── components/
│   ├── LocationInput.tsx        # 地域名入力 + オートコンプリート
│   ├── WeatherCard.tsx          # 1拠点の警報状況カード（シルエット背景付き）
│   ├── JudgmentBanner.tsx       # 出社可否バナー
│   ├── PrefectureSilhouette.tsx # 都道府県SVGシルエット
│   ├── ThemeToggle.tsx          # ライト/ダーク切り替えボタン
│   ├── PushNotificationButton.tsx # プッシュ通知 ON/OFF ボタン
│   ├── InstallPrompt.tsx        # iOS ホーム画面追加ガイド
│   └── Footer.tsx               # 免責事項フッター
├── hooks/
│   ├── useTheme.ts              # テーマ状態管理フック
│   └── usePushNotification.ts  # プッシュ通知状態管理フック
├── lib/
│   ├── jma.ts                   # 気象庁警報 API クライアント
│   ├── weather.ts               # 天気予報・AMeDAS 取得
│   ├── judgment.ts              # 警報レベル分類・出社可否判定
│   ├── areas.ts                 # 地域検索ユーティリティ
│   ├── kv.ts                    # Redis CRUD（購読情報管理）
│   └── push.ts                  # VAPID 設定・通知ペイロード生成・送信
├── types/
│   ├── jma.ts                   # 気象ドメイン型定義
│   └── push.ts                  # プッシュ通知ドメイン型定義
└── data/
    ├── areas.json               # 全国市区町村マスタ
    └── prefecture-paths.ts      # 都道府県SVGパス（アスペクト比補正済み）

public/
├── sw.js                        # Service Worker（Push イベント受信）
└── icons/
    ├── icon-192.svg
    └── icon-512.svg

```

---

## キャッシュ構成

Vercel デプロイ時、以下の **2層キャッシュ** により気象庁APIへのリクエスト頻度を制限しています。

### Layer 1: Next.js サーバーサイドキャッシュ（fetch cache）

`next: { revalidate: N }` により、同一サーバーインスタンス内でのキャッシュを制御します。

| 対象                                 | revalidate          | 更新頻度       |
| ------------------------------------ | ------------------- | -------------- |
| 警報・注意報 API (`/bosai/warning/`) | **600秒（10分）**   | 最大10分に1回  |
| AMeDAS 観測 API (`/bosai/amedas/`)   | **600秒（10分）**   | 最大10分に1回  |
| 天気予報 API (`/bosai/forecast/`)    | **3600秒（1時間）** | 最大1時間に1回 |

### Layer 2: Vercel CDN キャッシュ（`Cache-Control` ヘッダー）

API ルートのレスポンスに `Cache-Control` ヘッダーを付与し、Vercel エッジキャッシュを制御します。

| API ルート             | ヘッダー                                  | 動作                  |
| ---------------------- | ----------------------------------------- | --------------------- |
| `/api/weather`         | `s-maxage=600, stale-while-revalidate=60` | 10分間 CDN キャッシュ |
| `/api/current-weather` | `s-maxage=600, stale-while-revalidate=60` | 10分間 CDN キャッシュ |

> **結果**: 警報・注意報データは **最大10分に1回** 気象庁APIにリクエストが発生します。複数ユーザーが同時アクセスしても、CDNキャッシュが有効な間は気象庁APIへの追加リクエストは発生しません。

---

## API エンドポイント

### `GET /api/weather`

警報・注意報情報を返します。

| パラメータ   | 型           | 説明                                  |
| ------------ | ------------ | ------------------------------------- |
| `officeCode` | string (6桁) | 気象台コード（例: `130000` = 東京都） |
| `cityCode`   | string (7桁) | 市区町村コード（例: `1310100`）       |

**レスポンス例 (200 OK)**:

```json
{
  "alerts": [
    { "code": "03", "name": "大雨警報", "status": "発表", "level": "warning" }
  ],
  "alertLevel": "warning",
  "cachedAt": "2024-01-15T06:00:00+09:00",
  "isStale": false,
  "publishingOffice": "東京管区気象台"
}
```

### `GET /api/current-weather`

現在気温・天気概況を返します。

| パラメータ   | 型           | 説明         |
| ------------ | ------------ | ------------ |
| `officeCode` | string (6桁) | 気象台コード |

**レスポンス例 (200 OK)**:

```json
{
  "weatherCode": "308",
  "description": "くもり 所により 雨 で 雷を伴い 激しく降る",
  "emoji": "⛈️",
  "temp": 28,
  "tempMin": 24,
  "tempMax": 31
}
```

### `POST /api/push/subscribe`

プッシュ通知の購読を登録します。自宅・勤務地のいずれか一方のみの設定でも登録できます。

**リクエストボディ**:

```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": { "p256dh": "...", "auth": "..." }
  },
  "homeOfficeCode": "130000",
  "homeCityCode": "1310100",
  "officeOfficeCode": null,
  "officeCityCode": null
}
```

### `DELETE /api/push/unsubscribe`

購読を解除します。

**リクエストボディ**: `{ "endpoint": "https://..." }`

### `POST /api/cron/notify`

登録済みの購読者全員に出社判定を通知します。GitHub Actions から10分ごとに呼び出されます。

**認証**: `Authorization: Bearer {CRON_SECRET}` ヘッダーが必要です。

**レスポンス例**:

```json
{ "processed": 42, "notified": 5, "errors": 0 }
```

**共通エラーレスポンス**:

| HTTP ステータス | code              | 説明                     |
| --------------- | ----------------- | ------------------------ |
| 400             | `INVALID_PARAMS`  | パラメータ欠落・形式不正 |
| 401             | —                 | 認証失敗                 |
| 502             | `JMA_UNAVAILABLE` | 気象庁 API 障害          |
| 500             | `PARSE_ERROR`     | レスポンスパースエラー   |

---

## プッシュ通知の仕組み

```
GitHub Actions (*/10 * * * *)
  └→ POST /api/cron/notify
       ├→ Redis から全購読者を取得
       ├→ 気象庁 API から警報情報を取得（officeCode 単位でキャッシュ）
       ├→ 出社判定を実行
       ├→ 前回と判定が変わった購読者にのみ Push 通知を送信
       └→ HTTP 410 の宛先は自動削除・30日未通知の購読は自動削除
```

iOS Safari でプッシュ通知を受け取るには、ホーム画面に追加（PWA インストール）が必要です。アプリ内にインストール手順のガイドが表示されます。

---

## 警報コード分類

| AlertLevel         | 種別                                               |
| ------------------ | -------------------------------------------------- |
| `special-warning`  | 特別警報（大雨・暴風・高潮・波浪・大雪・暴風雪）   |
| `critical-warning` | 特定警報（土砂災害警戒情報など）                   |
| `warning`          | 警報（大雨・洪水・暴風・高潮・波浪・大雪・暴風雪） |
| `advisory`         | 注意報（大雨・雷・強風・大雪・濃霧など）           |
| `none`             | 発令なし                                           |

---

## Vercel へのデプロイ

1. GitHub にリポジトリをプッシュ
2. [Vercel](https://vercel.com) でプロジェクトをインポート
3. Vercel KV（Redis）をプロジェクトに追加
4. 以下の環境変数を Vercel ダッシュボードで設定:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
   - `REDIS_URL`（Vercel KV ダッシュボードからコピー）
   - `CRON_SECRET`
5. [cron-job.org](https://cron-job.org) で Cron ジョブを作成:
   - URL: `https://your-app.vercel.app/api/cron/notify`
   - Method: POST
   - Header: `Authorization: Bearer {CRON_SECRET}`
   - Schedule: Every 10 minutes

> **プッシュ通知なしで使う場合**: 環境変数を設定しなければ、プッシュ通知ボタンは非表示になります。通知以外の全機能は環境変数なしで動作します。

---

## 免責事項

本アプリが提供する気象情報は参考情報です。最終的な判断はご自身の責任で行ってください。本アプリの情報を利用したことにより生じた損害について、一切の責任を負いません。

気象情報の正確性は気象庁 API に依存します。本アプリは気象庁の公式サービスではありません。

---

## ライセンス

MIT
