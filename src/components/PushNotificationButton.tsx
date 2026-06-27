"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { usePushNotification } from "@/hooks/usePushNotification";
import StayHomeConditionForm from "@/components/StayHomeConditionForm";
import type { AreaEntry } from "@/types/jma";
import type { StayHomeCondition } from "@/types/push";

interface Props {
  home: AreaEntry | null;
  office: AreaEntry | null;
}

const GLASS = "backdrop-blur-md border border-slate-200 dark:border-white/[0.12]";

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function BellOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
      <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
      <path d="M18 8a6 6 0 0 0-9.33-5" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

function conditionSummary(condition: StayHomeCondition | null): string {
  if (!condition) return "デフォルト（警報以上）";
  const parts: string[] = [];
  if (condition.levelThreshold) {
    const labels: Record<string, string> = {
      advisory: "注意報以上",
      warning: "警報以上",
      "critical-warning": "危険警報以上",
      "special-warning": "特別警報のみ",
    };
    parts.push(`レベル: ${labels[condition.levelThreshold] ?? condition.levelThreshold}`);
  }
  if (condition.warningCodes && condition.warningCodes.length > 0) {
    parts.push(`警報種別: ${condition.warningCodes.length}件`);
  }
  return parts.join(" / ");
}

// ─── SettingsButton ──────────────────────────────────────────────────────────

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="absolute top-2.5 right-3 group">
      <button
        type="button"
        aria-label="通知条件を設定する"
        onClick={onClick}
        className="p-1 rounded-md transition-colors
          text-slate-300 dark:text-white/20
          hover:text-slate-500 dark:hover:text-white/50
          hover:bg-slate-100 dark:hover:bg-white/[0.06]"
      >
        <GearIcon />
      </button>
      <div className="absolute right-0 top-full mt-1.5 px-2 py-1 rounded-md text-xs whitespace-nowrap pointer-events-none z-10
        bg-slate-700 dark:bg-slate-200
        text-white dark:text-slate-800
        opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        通知条件を設定する
      </div>
    </div>
  );
}

// ─── ConditionModal ──────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  value: StayHomeCondition | null;
  onChange: (c: StayHomeCondition | null) => void;
  onClose: () => void;
}

function ConditionModal({ open, value, onChange, onClose }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop — rendered in portal, no stacking context conflicts */}
      <div className="fixed inset-0 bg-black/50 anim-fade-in" aria-hidden="true" />

      {/* Centering wrapper */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className="w-full max-w-sm rounded-2xl flex flex-col max-h-[85vh] anim-scale-in
            border border-slate-200 dark:border-white/[0.12]"
          style={{ background: "var(--modal-card-bg)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
            <DialogTitle className="text-sm font-semibold text-slate-700 dark:text-white/80">
              通知条件を設定する
            </DialogTitle>
            <button
              type="button"
              aria-label="閉じる"
              onClick={onClose}
              className="text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Scrollable form */}
          <div className="overflow-y-auto px-5 pb-5 flex-1">
            <StayHomeConditionForm value={value} onChange={onChange} />
          </div>

          {/* Done button */}
          <div className="px-5 pt-3 pb-5 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 rounded-full text-sm font-medium transition-colors
                bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20
                text-slate-600 hover:text-slate-800 dark:text-white/60 dark:hover:text-white
                border border-slate-200 dark:border-white/[0.12]"
            >
              完了
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ─── PushNotificationButton ──────────────────────────────────────────────────

export default function PushNotificationButton({ home, office }: Props) {
  const [pendingCondition, setPendingCondition] = useState<StayHomeCondition | null>(null);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const conditionInitialized = useRef(false);

  const { state, subscribe, unsubscribe } = usePushNotification(home, office, pendingCondition);

  useEffect(() => {
    if (!conditionInitialized.current && state.permission === "subscribed") {
      setPendingCondition(state.registeredCondition);
      conditionInitialized.current = true;
    }
  }, [state.permission, state.registeredCondition]);

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
    const { registeredHome, registeredOffice, registeredCondition } = state;
    const homeChanged = (home?.cityCode ?? null) !== (registeredHome?.cityCode ?? null);
    const officeChanged = (office?.cityCode ?? null) !== (registeredOffice?.cityCode ?? null);
    const locationChanged = homeChanged || officeChanged;
    const hasRegistered = registeredHome !== null || registeredOffice !== null;
    const hasCurrentLocation = home !== null || office !== null;
    const conditionChanged =
      JSON.stringify(pendingCondition) !== JSON.stringify(registeredCondition);
    const needsUpdate = (locationChanged && hasCurrentLocation) || conditionChanged;

    return (
      <>
        <div
          className={`relative rounded-2xl px-4 py-3 mt-4 flex flex-col items-center gap-2 ${GLASS}`}
          style={{ background: "var(--card-bg-muted)" }}
        >
          <SettingsButton onClick={() => setShowConditionModal(true)} />

          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <BellIcon />
            <span>{state.isLoading ? "設定を更新中..." : "通知が有効です"}</span>
          </div>

          {!state.isLoading && hasRegistered && (
            <div className="flex flex-col items-center gap-0.5">
              {registeredHome && <LocationLabel label="自宅" area={registeredHome} />}
              {registeredOffice && <LocationLabel label="勤務地" area={registeredOffice} />}
            </div>
          )}

          {!state.isLoading && (
            <span className="text-xs text-slate-400 dark:text-white/25">
              通知条件: {conditionSummary(registeredCondition)}
            </span>
          )}

          {!state.isLoading && locationChanged && hasCurrentLocation && (
            <p className="text-xs text-amber-500 dark:text-amber-400">
              地域設定が変更されています
            </p>
          )}

          {!state.isLoading && !hasRegistered && !hasCurrentLocation && (
            <p className="text-xs text-amber-500 dark:text-amber-400">
              地域を設定してから通知地域を更新してください
            </p>
          )}

          <div className="flex flex-row gap-2 items-center justify-center">
            {!state.isLoading && needsUpdate && hasCurrentLocation && (
              <button
                type="button"
                onClick={() => void subscribe()}
                disabled={state.isLoading}
                className="text-xs px-3 py-1 rounded-full transition-colors
                  bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/40 dark:hover:bg-sky-800/50
                  text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100
                  border border-sky-300 dark:border-sky-700
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                通知設定を更新する
              </button>
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
          </div>

          {state.errorMessage && (
            <p className="text-xs text-red-500 dark:text-red-400">{state.errorMessage}</p>
          )}
        </div>

        <ConditionModal
          open={showConditionModal}
          value={pendingCondition}
          onChange={setPendingCondition}
          onClose={() => setShowConditionModal(false)}
        />
      </>
    );
  }

  const locationUnset = !home && !office;

  return (
    <>
      <div
        className={`relative rounded-2xl px-4 py-3 mt-4 flex flex-col items-center gap-2 ${GLASS}`}
        style={{ background: "var(--card-bg-muted)" }}
      >
        <SettingsButton onClick={() => setShowConditionModal(true)} />

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

      <ConditionModal
        open={showConditionModal}
        value={pendingCondition}
        onChange={setPendingCondition}
        onClose={() => setShowConditionModal(false)}
      />
    </>
  );
}
