"use client";

import { usePushNotification } from "@/hooks/usePushNotification";
import type { AreaEntry } from "@/types/jma";

interface Props {
  home: AreaEntry | null;
  office: AreaEntry | null;
}

const GLASS = "backdrop-blur-md border border-slate-200 dark:border-white/[0.12]";

function BellIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function BellOffIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
      <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
      <path d="M18 8a6 6 0 0 0-9.33-5" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function LocationLabel({ label, area }: { label: string; area: AreaEntry }) {
  return (
    <span className="text-xs text-slate-500 dark:text-white/40">
      {label}: {area.cityName}（{area.officeName}）
    </span>
  );
}

export default function PushNotificationButton({ home, office }: Props) {
  const { state, subscribe, unsubscribe } = usePushNotification(home, office);

  if (state.permission === "unsupported") return null;

  if (state.permission === "denied") {
    return (
      <div
        className={`rounded-2xl px-4 py-3 mt-4 flex flex-col items-center gap-1.5 ${GLASS}`}
        style={{ background: "var(--card-bg-muted)" }}
      >
        <div className="flex items-center gap-2 text-slate-400 dark:text-white/30">
          <BellOffIcon />
          <span className="text-sm font-medium">通知がブロックされています</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-white/25">
          ブラウザの設定から通知を許可してください
        </p>
      </div>
    );
  }

  if (state.permission === "subscribed") {
    const { registeredHome, registeredOffice } = state;
    return (
      <div
        className={`rounded-2xl px-4 py-3 mt-4 flex flex-col items-center gap-2 ${GLASS}`}
        style={{ background: "var(--card-bg-muted)" }}
      >
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
          <BellIcon />
          <span>{state.isLoading ? "設定を更新中..." : "通知が有効です"}</span>
        </div>
        {!state.isLoading && (registeredHome || registeredOffice) && (
          <div className="flex flex-col items-center gap-0.5">
            {registeredHome && <LocationLabel label="自宅" area={registeredHome} />}
            {registeredOffice && <LocationLabel label="勤務地" area={registeredOffice} />}
          </div>
        )}
        <button
          type="button"
          onClick={() => void unsubscribe()}
          disabled={state.isLoading}
          className="text-xs px-3 py-1 rounded-full transition-colors
            bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20
            text-slate-500 hover:text-slate-700 dark:text-white/50 dark:hover:text-white/80
            border border-slate-200 dark:border-white/[0.12]
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          通知を解除する
        </button>
        {state.errorMessage && (
          <p className="text-xs text-red-500 dark:text-red-400">{state.errorMessage}</p>
        )}
      </div>
    );
  }

  const locationUnset = !home && !office;

  return (
    <div
      className={`rounded-2xl px-4 py-3 mt-4 flex flex-col items-center gap-2 ${GLASS}`}
      style={{ background: "var(--card-bg-muted)" }}
    >
      <button
        type="button"
        onClick={() => void subscribe()}
        disabled={state.isLoading || locationUnset}
        className="flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full transition-colors
          bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20
          text-slate-600 hover:text-slate-800 dark:text-white/60 dark:hover:text-white
          border border-slate-200 dark:border-white/[0.12]
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <BellIcon />
        {state.isLoading ? "処理中..." : "通知を有効にする"}
      </button>
      {locationUnset ? (
        <p className="text-xs text-slate-400 dark:text-white/25">
          自宅または勤務地を設定すると通知を有効にできます
        </p>
      ) : (
        <p className="text-xs text-slate-400 dark:text-white/25">
          出社可否が変わったときに通知が届きます
        </p>
      )}
      {state.errorMessage && (
        <p className="text-xs text-red-500 dark:text-red-400">{state.errorMessage}</p>
      )}
    </div>
  );
}
