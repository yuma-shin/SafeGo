"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  RadioGroup,
  Radio,
} from "@headlessui/react";
import type { StayHomeCondition, AlertLevelThreshold } from "@/types/push";
import { ALERT_PROFILES, findMatchingProfile } from "@/lib/alertProfiles";

type LevelChoice = AlertLevelThreshold | "";

const LEVEL_OPTIONS: { value: LevelChoice; label: string }[] = [
  { value: "", label: "デフォルト（警報以上）" },
  { value: "advisory", label: "注意報以上" },
  { value: "warning", label: "警報以上" },
  { value: "critical-warning", label: "危険警報以上" },
  { value: "special-warning", label: "特別警報のみ" },
];

const WARNING_CODE_GROUPS: { label: string; codes: { code: string; name: string }[] }[] = [
  {
    label: "警報",
    codes: [
      { code: "03", name: "大雨警報" },
      { code: "04", name: "洪水警報" },
      { code: "05", name: "暴風警報" },
      { code: "02", name: "暴風雪警報" },
      { code: "06", name: "大雪警報" },
      { code: "07", name: "波浪警報" },
      { code: "08", name: "高潮警報" },
      { code: "09", name: "土砂災害警報" },
    ],
  },
  {
    label: "危険警報",
    codes: [
      { code: "43", name: "大雨危険警報" },
      { code: "48", name: "高潮危険警報" },
      { code: "49", name: "土砂災害危険警報" },
    ],
  },
  {
    label: "特別警報",
    codes: [
      { code: "33", name: "大雨特別警報" },
      { code: "32", name: "暴風雪特別警報" },
      { code: "35", name: "暴風特別警報" },
      { code: "36", name: "大雪特別警報" },
      { code: "37", name: "波浪特別警報" },
      { code: "38", name: "高潮特別警報" },
      { code: "39", name: "土砂災害特別警報" },
    ],
  },
  {
    label: "注意報",
    codes: [
      { code: "10", name: "大雨注意報" },
      { code: "18", name: "洪水注意報" },
      { code: "15", name: "強風注意報" },
      { code: "13", name: "風雪注意報" },
      { code: "14", name: "雷注意報" },
      { code: "12", name: "大雪注意報" },
      { code: "16", name: "波浪注意報" },
      { code: "19", name: "高潮注意報" },
      { code: "29", name: "土砂災害注意報" },
      { code: "17", name: "融雪注意報" },
      { code: "20", name: "濃霧注意報" },
      { code: "21", name: "乾燥注意報" },
      { code: "22", name: "なだれ注意報" },
      { code: "23", name: "低温注意報" },
      { code: "24", name: "霜注意報" },
      { code: "25", name: "着氷注意報" },
      { code: "26", name: "着雪注意報" },
    ],
  },
];

const ALL_CODES = WARNING_CODE_GROUPS.flatMap((g) => g.codes);

function getNameForCode(code: string): string {
  return ALL_CODES.find((c) => c.code === code)?.name ?? code;
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  );
}

// ─── WarningCodeCombobox ────────────────────────────────────────────────────

interface ComboboxProps {
  selected: string[];
  onChange: (codes: string[]) => void;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

function WarningCodeCombobox({ selected, onChange }: ComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0, maxHeight: 240 });
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipHUIRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const selectedSet = new Set(selected);
  const filtered = ALL_CODES.filter(
    ({ code, name }) => !selectedSet.has(code) && (query === "" || name.includes(query))
  );
  const showDropdown = isOpen && (filtered.length > 0 || query !== "");

  // Calculate dropdown position; flips above the input when space below is limited.
  const reposition = useCallback(() => {
    const input = wrapperRef.current?.querySelector("input");
    if (!input) return;
    const r = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const spaceAbove = r.top - 8;
    const maxH = 240;
    if (spaceBelow >= 120 || spaceBelow >= spaceAbove) {
      setPos({ top: r.bottom + 4, left: r.left, width: r.width, maxHeight: Math.min(maxH, Math.max(80, spaceBelow)) });
    } else {
      const h = Math.min(maxH, Math.max(80, spaceAbove));
      setPos({ top: r.top - h - 4, left: r.left, width: r.width, maxHeight: h });
    }
  }, []);

  const open = useCallback(() => {
    reposition();
    setIsOpen(true);
  }, [reposition]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const add = useCallback((code: string) => {
    onChange([...selected, code].sort());
    setQuery("");
    setIsOpen(false);
  }, [selected, onChange]);

  const remove = useCallback((code: string) => {
    onChange(selected.filter((c) => c !== code));
  }, [selected, onChange]);

  // Reposition when tags change while the dropdown is open (e.g. tag removed).
  useLayoutEffect(() => {
    if (!isOpen) return;
    reposition();
  }, [isOpen, selected.length, reposition]);

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapperRef.current?.contains(t)) return;
      if (document.getElementById("wc-dd")?.contains(t)) return;
      setIsOpen(false);
      setQuery("");
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const dropdown = showDropdown ? (
    <ComboboxOptions
      static
      id="wc-dd"
      className="rounded-xl bg-white dark:bg-gray-900
        ring-1 ring-black/10 dark:ring-white/10
        p-1 shadow-xl"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
        overflowY: "auto",
        zIndex: 200,
      }}
    >
      {filtered.length === 0 ? (
        <div className="px-3 py-2 text-sm text-slate-400 dark:text-white/30">
          該当する警報種別が見つかりません
        </div>
      ) : (
        filtered.map(({ code, name }) => (
          <ComboboxOption
            key={code}
            value={code}
            onPointerDown={() => { skipHUIRef.current = true; }}
            onClick={() => { skipHUIRef.current = false; add(code); }}
            className="group flex cursor-default items-center rounded-lg px-3 py-2
              select-none data-[focus]:bg-indigo-600 data-[focus]:text-white"
            style={{ minHeight: "40px" }}
          >
            <span className="text-sm text-slate-700 dark:text-white/80 group-data-[focus]:text-white">
              {name}
            </span>
          </ComboboxOption>
        ))
      )}
    </ComboboxOptions>
  ) : null;

  const tags = selected.length > 0 ? (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {selected.map((code) => {
        const name = getNameForCode(code);
        return (
          <span
            key={code}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm
              bg-indigo-50 dark:bg-indigo-500/20
              text-indigo-600 dark:text-indigo-300
              ring-1 ring-indigo-200 dark:ring-indigo-500/40"
          >
            {name}
            <button
              type="button"
              aria-label={`${name}を削除`}
              onClick={() => remove(code)}
              className="ml-0.5 text-indigo-400 hover:text-indigo-700 dark:hover:text-white transition-colors"
            >
              ×
            </button>
          </span>
        );
      })}
    </div>
  ) : null;

  if (isMobile) {
    return (
      <div>
        {tags}
        <select
          value=""
          onChange={(e) => { if (e.target.value) add(e.target.value); }}
          aria-label="警報種別を選択"
          className="w-full rounded-lg
            bg-white dark:bg-white/5
            py-2.5 pl-3 pr-3 text-sm
            text-slate-800 dark:text-white
            ring-1 ring-black/10 dark:ring-white/10
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            transition-shadow"
          style={{ fontSize: "16px" }}
        >
          <option value="">警報種別を選択...</option>
          {WARNING_CODE_GROUPS.map(({ label, codes }) => {
            const available = codes.filter(({ code }) => !selectedSet.has(code));
            if (available.length === 0) return null;
            return (
              <optgroup key={label} label={label}>
                {available.map(({ code, name }) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="w-full">
      {tags}

      <Combobox
        immediate
        onChange={(code: string | null) => {
          if (skipHUIRef.current) { skipHUIRef.current = false; return; }
          if (code) add(code);
        }}
      >
        <ComboboxInput
          displayValue={() => ""}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={open}
          onKeyDown={(e) => { if (e.key === "Escape") close(); }}
          placeholder="警報種別を検索..."
          aria-label="警報種別を検索"
          className="w-full rounded-lg
            bg-white dark:bg-white/5
            py-2.5 pl-3 pr-3 text-sm
            text-slate-800 dark:text-white
            ring-1 ring-black/10 dark:ring-white/10
            placeholder:text-slate-400 dark:placeholder:text-white/30
            focus:outline-none data-[focus]:ring-2 data-[focus]:ring-indigo-500
            transition-shadow"
        />
        {isMounted ? createPortal(dropdown, document.body) : dropdown}
      </Combobox>
    </div>
  );
}

// ─── StayHomeConditionForm ──────────────────────────────────────────────────

interface Props {
  value: StayHomeCondition | null;
  onChange: (condition: StayHomeCondition | null) => void;
}

function buildCondition(level: LevelChoice, codes: string[]): StayHomeCondition | null {
  const hasLevel = level !== "";
  const hasCodes = codes.length > 0;
  if (!hasLevel && !hasCodes) return null;
  const condition: StayHomeCondition = {};
  if (hasLevel) condition.levelThreshold = level as AlertLevelThreshold;
  if (hasCodes) condition.warningCodes = codes;
  return condition;
}

export default function StayHomeConditionForm({ value, onChange }: Props) {
  const level: LevelChoice = value?.levelThreshold ?? "";
  const selectedCodes = value?.warningCodes ?? [];
  const matchedProfileId = findMatchingProfile(selectedCodes)?.id ?? "";

  function handleLevelChange(newLevel: LevelChoice) {
    onChange(buildCondition(newLevel, selectedCodes));
  }

  function handleCodesChange(newCodes: string[]) {
    onChange(buildCondition(level, newCodes));
  }

  function handleProfileChange(profileId: string) {
    const profile = ALERT_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;
    handleCodesChange([...profile.codes]);
  }

  return (
    <div className="w-full text-left">
      <p className="text-xs font-medium text-slate-500 dark:text-white/40 mb-2">通知レベル</p>

      <RadioGroup value={level} onChange={handleLevelChange} className="space-y-2 mb-5">
        {LEVEL_OPTIONS.map((opt) => (
          <Radio
            key={String(opt.value)}
            value={opt.value}
            aria-label={opt.label}
            className="group relative flex cursor-pointer items-center justify-between
              rounded-lg px-4 py-3
              bg-slate-50 dark:bg-white/5
              ring-1 ring-slate-200 dark:ring-white/10
              data-[checked]:bg-indigo-50 dark:data-[checked]:bg-indigo-950
              data-[checked]:ring-indigo-400 dark:data-[checked]:ring-indigo-500
              focus:outline-none data-[focus]:ring-2 data-[focus]:ring-indigo-500
              transition-colors"
          >
            <span className="text-sm
              text-slate-600 dark:text-white/60
              group-data-[checked]:text-indigo-700 dark:group-data-[checked]:text-white">
              {opt.label}
            </span>
            <CheckCircleIcon className="size-5 flex-shrink-0
              text-indigo-500 dark:text-indigo-400
              opacity-0 group-data-[checked]:opacity-100 transition-opacity" />
          </Radio>
        ))}
      </RadioGroup>

      <p className="text-xs font-medium text-slate-500 dark:text-white/40 mb-2">プリセット（任意）</p>

      <RadioGroup value={matchedProfileId} onChange={handleProfileChange} className="space-y-2 mb-5">
        {ALERT_PROFILES.map((profile) => (
          <Radio
            key={profile.id}
            value={profile.id}
            aria-label={profile.label}
            className="group relative flex cursor-pointer items-center justify-between
              rounded-lg px-4 py-3
              bg-slate-50 dark:bg-white/5
              ring-1 ring-slate-200 dark:ring-white/10
              data-[checked]:bg-indigo-50 dark:data-[checked]:bg-indigo-950
              data-[checked]:ring-indigo-400 dark:data-[checked]:ring-indigo-500
              focus:outline-none data-[focus]:ring-2 data-[focus]:ring-indigo-500
              transition-colors"
          >
            <span className="text-sm
              text-slate-600 dark:text-white/60
              group-data-[checked]:text-indigo-700 dark:group-data-[checked]:text-white">
              {profile.label}
            </span>
            <CheckCircleIcon className="size-5 flex-shrink-0
              text-indigo-500 dark:text-indigo-400
              opacity-0 group-data-[checked]:opacity-100 transition-opacity" />
          </Radio>
        ))}
      </RadioGroup>

      <p className="text-xs font-medium text-slate-500 dark:text-white/40 mb-2">特定の警報種別（任意）</p>
      <WarningCodeCombobox selected={selectedCodes} onChange={handleCodesChange} />
    </div>
  );
}
