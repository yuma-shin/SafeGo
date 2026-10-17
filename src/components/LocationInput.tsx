"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { searchAreas } from "@/lib/areas";
import type { AreaEntry } from "@/types/jma";

interface LocationInputProps {
  label: string;
  value: AreaEntry | null;
  onSelect: (area: AreaEntry | null) => void;
  placeholder?: string;
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
    </svg>
  );
}

export default function LocationInput({
  label,
  value,
  onSelect,
  placeholder = "地域名を入力（例: 大阪市）",
}: LocationInputProps) {
  const inputId = useId();
  const [candidates, setCandidates] = useState<AreaEntry[]>([]);
  const [searched, setSearched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // In real browsers: pointerdown sets true → HUI mousedown onChange skips → onClick handles.
  // In tests: fireEvent.click skips pointerdown → HUI onChange never fires → only onClick runs.
  const skipNextHUIChangeRef = useRef(false);

  const showDropdown = candidates.length > 0 || (searched && candidates.length === 0);

  const handleSelect = useCallback(
    (area: AreaEntry | null) => {
      if (area) onSelect(area);
      setCandidates([]);
      setSearched(false);
    },
    [onSelect]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearched(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setCandidates([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const results = searchAreas(text);
      setCandidates(results);
      setSearched(true);
    }, 300);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setCandidates([]);
      setSearched(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    onSelect(null);
    setCandidates([]);
    setSearched(false);
  }, [onSelect]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setCandidates([]);
        setSearched(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={inputId} className="location-label">
        <span className="location-number" aria-hidden="true">{label === "自宅" ? "01" : "02"}</span>{label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Combobox
            value={value}
            onChange={(area: AreaEntry | null) => {
              if (skipNextHUIChangeRef.current) {
                skipNextHUIChangeRef.current = false;
                return;
              }
              handleSelect(area);
            }}
            by="cityCode"
            immediate
          >
            <ComboboxInput
              id={inputId}
              displayValue={(area: AreaEntry | null) => area?.cityName ?? ""}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="ui-input"
              style={{ fontSize: "16px" }}
            />

            <ComboboxButton aria-label={`${label}の地域候補を表示`} className="input-trigger group">
              <ChevronDownIcon className="size-4 text-slate-400 dark:text-neutral-300 group-data-[hover]:text-slate-600 dark:group-data-[hover]:text-white transition-colors" />
            </ComboboxButton>

            {showDropdown && (
              <ComboboxOptions
                static
                className="ui-dropdown absolute z-20 w-full mt-2 anim-slide-down"
                style={{ maxHeight: "240px", overflowY: "auto" }}
              >
                <div className="dropdown-heading" role="presentation">地域を選択<span>{candidates.length}件</span></div>
                {candidates.length === 0 && searched ? (
                  <div className="px-3 py-2 text-base text-slate-400 dark:text-neutral-300">
                    該当する地域が見つかりません
                  </div>
                ) : (
                  candidates.map((area) => (
                    <ComboboxOption
                      key={area.cityCode}
                      value={area}
                      onPointerDown={() => { skipNextHUIChangeRef.current = true; }}
                      onClick={() => { skipNextHUIChangeRef.current = false; handleSelect(area); }}
                      className="ui-option group select-none"
                    >
                      <span className="option-indicator" aria-hidden="true">
                        <CheckIcon className="size-4 opacity-0 group-data-[selected]:opacity-100" />
                      </span>
                      <span className="option-content">
                        {area.cityName}
                        <span className="option-meta">
                          {area.officeName}
                        </span>
                      </span>
                    </ComboboxOption>
                  ))
                )}
              </ComboboxOptions>
            )}
          </Combobox>
        </div>

        {value && (
          <button
            type="button"
            onClick={handleReset}
            aria-label="クリア"
            className="icon-button clear-button flex-shrink-0"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
