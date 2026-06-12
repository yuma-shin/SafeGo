"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { searchAreas } from "@/lib/areas";
import type { AreaEntry } from "@/types/jma";

interface LocationInputProps {
  label: string;
  value: AreaEntry | null;
  onSelect: (area: AreaEntry | null) => void;
  placeholder?: string;
}

export default function LocationInput({
  label,
  value,
  onSelect,
  placeholder = "地域名を入力（例: 大阪市）",
}: LocationInputProps) {
  const [inputText, setInputText] = useState("");
  const [candidates, setCandidates] = useState<AreaEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searched, setSearched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value) {
      setInputText(value.cityName);
    } else {
      setInputText("");
    }
  }, [value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setInputText(text);
      setActiveIndex(-1);
      setSearched(false);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const results = searchAreas(text);
        setCandidates(results);
        setIsOpen(true);
        setSearched(true);
      }, 300);
    },
    []
  );

  const handleSelect = useCallback(
    (area: AreaEntry) => {
      onSelect(area);
      setInputText(area.cityName);
      setIsOpen(false);
      setCandidates([]);
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, candidates.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < candidates.length) {
          handleSelect(candidates[activeIndex]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [isOpen, candidates, activeIndex, handleSelect]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReset = useCallback(() => {
    onSelect(null);
    setInputText("");
    setCandidates([]);
    setIsOpen(false);
  }, [onSelect]);

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-medium text-slate-500 dark:text-white/60 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="location-listbox"
          aria-haspopup="listbox"
          aria-autocomplete="list"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg
            text-slate-800 dark:text-white
            placeholder:text-slate-300 dark:placeholder:text-white/25
            focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/20
            transition-all"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--input-border)",
            fontSize: "16px",
          }}
        />
        {value && (
          <button
            type="button"
            onClick={handleReset}
            aria-label="クリア"
            className="flex-shrink-0 px-2 py-2 text-slate-300 dark:text-white/40 hover:text-slate-500 dark:hover:text-white/70 rounded transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <ul
          id="location-listbox"
          role="listbox"
          className="absolute z-20 w-full mt-1 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
          style={{
            background: "var(--dropdown-bg)",
            border: "1px solid var(--dropdown-border)",
            backdropFilter: "blur(12px)",
          }}
        >
          {candidates.length === 0 && searched ? (
            <li className="px-4 py-3 text-sm text-slate-400 dark:text-white/40">
              該当する地域が見つかりません
            </li>
          ) : (
            candidates.map((area, idx) => (
              <li
                key={area.cityCode}
                role="option"
                aria-selected={idx === activeIndex}
                onClick={() => handleSelect(area)}
                className={`px-4 cursor-pointer
                  text-slate-700 dark:text-white/85
                  border-b border-slate-100 dark:border-white/[0.06] last:border-0
                  transition-colors ${
                    idx === activeIndex
                      ? "bg-slate-100 dark:bg-white/15"
                      : "hover:bg-slate-50 dark:hover:bg-white/[0.08]"
                  }`}
                style={{ minHeight: "44px", display: "flex", alignItems: "center" }}
              >
                <span>
                  {area.cityName}
                  <span className="ml-2 text-xs text-slate-400 dark:text-white/35">
                    {area.officeName}
                  </span>
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
