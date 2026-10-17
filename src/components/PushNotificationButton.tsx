"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { usePushNotification } from "@/hooks/usePushNotification";
import StayHomeConditionForm from "@/components/StayHomeConditionForm";
import { findMatchingProfile } from "@/lib/alertProfiles";
import type { AreaEntry } from "@/types/jma";
import type { StayHomeCondition } from "@/types/push";

interface Props {
  home: AreaEntry | null;
  office: AreaEntry | null;
}

const GLASS = "soft-panel notification-panel";

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

function NotificationLocation({ label, area }: { label: string; area: AreaEntry | null }) {
  return (
    <div className="notification-detail">
      <dt>{label}</dt>
      <dd>
        <span className={`notification-value${area ? "" : " notification-value-empty"}`}>{area?.cityName ?? "未設定"}</span>
        {area && <span className="notification-meta">{area.officeName}</span>}
      </dd>
    </div>
  );
}

export function conditionSummary(condition: StayHomeCondition | null): string {
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
    const matchedProfile = findMatchingProfile(condition.warningCodes);
    parts.push(matchedProfile ? matchedProfile.label : `警報種別: ${condition.warningCodes.length}件`);
  }
  return parts.join(" / ");
}

function NotificationDetails({ home, office, condition }: Props & { condition: StayHomeCondition | null }) {
  return (
    <dl className="notification-details" aria-label="通知の設定内容">
      <NotificationLocation label="自宅" area={home} />
      <NotificationLocation label="勤務地" area={office} />
      <div className="notification-detail notification-condition">
        <dt>通知条件</dt>
        <dd className="notification-condition-values">
          {conditionSummary(condition).split(" / ").map((part) => <span className="notification-condition-value" key={part}>{part}</span>)}
        </dd>
      </div>
    </dl>
  );
}

// ─── SettingsButton ──────────────────────────────────────────────────────────

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" aria-label="通知条件を設定する" onClick={onClick} className="ui-button notification-settings">
      <GearIcon /><span>条件を変更</span>
    </button>
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
      <div className="dialog-backdrop fixed inset-0 anim-fade-in" aria-hidden="true" />

      {/* Centering wrapper */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className="soft-dialog w-full max-w-md flex flex-col max-h-[85dvh] anim-scale-in"
          style={{ background: "var(--modal-card-bg)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-700 dark:text-white">
              通知条件を設定する
            </DialogTitle>
            <button
              type="button"
              aria-label="閉じる"
              onClick={onClose}
              className="icon-button text-lg leading-none"
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
              className="ui-button ui-button-primary w-full"
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
  const [isIOS, setIsIOS] = useState(false);
  const [pendingCondition, setPendingCondition] = useState<StayHomeCondition | null>(null);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const conditionInitialized = useRef(false);

  const { state, subscribe, unsubscribe } = usePushNotification(home, office, pendingCondition);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

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
        style={{ background: "var(--card-bg)" }}
      >
        <div className="flex items-center gap-2 text-slate-400 dark:text-neutral-300">
          <BellOffIcon />
          <span className="text-base font-medium">通知がブロックされています</span>
        </div>
        <p className="text-sm text-slate-400 dark:text-neutral-300">
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
          className={GLASS}
          style={{ background: "var(--card-bg)" }}
        >
          <div className="notification-header">
            <div className="notification-heading">
              <span className="notification-symbol" aria-hidden="true"><BellIcon /></span>
              <div>
                <h2>通知設定</h2>
                <p role="status">{state.isLoading ? "設定を更新中..." : "通知が有効です"}</p>
              </div>
            </div>
            <SettingsButton onClick={() => setShowConditionModal(true)} />
          </div>

          {isIOS && !state.isLoading && (
            <p className="text-sm text-slate-400 dark:text-neutral-300 text-center leading-relaxed">
              iOSで即時通知を受け取るには、「設定」→「通知」→「SafeGo」の配信タイミングを「即時配信」に設定してください。
            </p>
          )}

          <NotificationDetails home={registeredHome} office={registeredOffice} condition={registeredCondition} />

          {!state.isLoading && needsUpdate && hasCurrentLocation && (
            <p role="status" className="notification-notice text-sm text-amber-700 dark:text-amber-300">
              {locationChanged
                ? conditionChanged ? "地域設定と通知条件が変更されています" : "地域設定が変更されています"
                : "通知条件が変更されています"}
              <br />
              「通知設定を更新する」を押して変更を反映してください。
            </p>
          )}

          {!state.isLoading && !hasRegistered && !hasCurrentLocation && (
            <p className="notification-notice text-sm text-amber-700 dark:text-amber-300">
              地域を設定してから通知地域を更新してください
            </p>
          )}

          <div className="notification-actions">
            {!state.isLoading && needsUpdate && hasCurrentLocation && (
              <button
                type="button"
                onClick={() => void subscribe()}
                disabled={state.isLoading}
                className="ui-button ui-button-primary"
              >
                通知設定を更新する
              </button>
            )}
            <button
              type="button"
              onClick={() => void unsubscribe()}
              disabled={state.isLoading}
              className="ui-button"
            >
              通知を解除する
            </button>
          </div>

          {state.errorMessage && (
            <p className="text-sm text-red-500 dark:text-red-400">{state.errorMessage}</p>
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
        className={GLASS}
        style={{ background: "var(--card-bg)" }}
      >
        <div className="notification-header">
          <div className="notification-heading">
            <span className="notification-symbol" aria-hidden="true"><BellOffIcon /></span>
            <div>
              <h2>通知設定</h2>
              <p>出社可否の変化をお知らせ</p>
            </div>
          </div>
          <SettingsButton onClick={() => setShowConditionModal(true)} />
        </div>

        <NotificationDetails home={home} office={office} condition={pendingCondition} />

        <div className="notification-actions">
          <button
            type="button"
            onClick={() => void subscribe()}
            disabled={state.isLoading || locationUnset}
            className="ui-button ui-button-primary"
          >
            <BellIcon />
            {state.isLoading ? "処理中..." : "通知を有効にする"}
          </button>
        </div>

        {locationUnset ? (
          <p className="notification-help text-sm text-slate-500 dark:text-neutral-300">
            自宅または勤務地を設定すると通知を有効にできます
          </p>
        ) : (
          <p className="notification-help text-sm text-slate-500 dark:text-neutral-300">
            出社可否が変わったときに通知が届きます
          </p>
        )}

        {state.errorMessage && (
          <p className="text-sm text-red-500 dark:text-red-400">{state.errorMessage}</p>
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
