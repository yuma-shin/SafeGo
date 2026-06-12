"use client";

import React, { useCallback, useEffect, useState } from "react";
import LocationInput from "@/components/LocationInput";
import WeatherCard from "@/components/WeatherCard";
import JudgmentBanner from "@/components/JudgmentBanner";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import { makeJudgment } from "@/lib/judgment";
import type {
  AlertLevel,
  AreaEntry,
  CurrentWeather,
  JudgmentResult,
  LocationWarningState,
  WarningResponse,
} from "@/types/jma";

const LS_HOME_KEY = "wac_home";
const LS_OFFICE_KEY = "wac_office";

// ページ背景グラデーション（警報レベル × テーマ）
const PAGE_GRADIENTS_DARK: Record<AlertLevel, string> = {
  none: "linear-gradient(150deg, #0c4a6e 0%, #0f172a 55%, #020617 100%)",
  advisory: "linear-gradient(150deg, #6b3a00 0%, #0f172a 55%, #020617 100%)",
  warning: "linear-gradient(150deg, #7c2d12 0%, #1e1b2e 55%, #020617 100%)",
  "critical-warning": "linear-gradient(150deg, #7f1d1d 0%, #1c1c2e 55%, #020617 100%)",
  "special-warning": "linear-gradient(150deg, #4c0519 0%, #1a0000 55%, #000000 100%)",
};

const PAGE_GRADIENTS_LIGHT: Record<AlertLevel, string> = {
  none: "linear-gradient(150deg, #dbeafe 0%, #e0f2fe 40%, #f0f9ff 100%)",
  advisory: "linear-gradient(150deg, #fef9c3 0%, #fffbeb 55%, #fefce8 100%)",
  warning: "linear-gradient(150deg, #fed7aa 0%, #fff7ed 55%, #fefce8 100%)",
  "critical-warning": "linear-gradient(150deg, #fecaca 0%, #fff5f5 55%, #fafafa 100%)",
  "special-warning": "linear-gradient(150deg, #fecdd3 0%, #ffe4e6 55%, #fff1f2 100%)",
};

function getWorstLevel(levels: (AlertLevel | undefined)[]): AlertLevel {
  const order: AlertLevel[] = [
    "special-warning",
    "critical-warning",
    "warning",
    "advisory",
    "none",
  ];
  for (const level of order) {
    if (levels.some((l) => l === level)) return level;
  }
  return "none";
}

interface AppState {
  home: AreaEntry | null;
  office: AreaEntry | null;
  homeWarnings: LocationWarningState | null;
  officeWarnings: LocationWarningState | null;
  homeLoading: boolean;
  officeLoading: boolean;
  homeError: string | null;
  officeError: string | null;
  homeWeather: CurrentWeather | null;
  officeWeather: CurrentWeather | null;
}

async function fetchWarnings(area: AreaEntry): Promise<WarningResponse> {
  const params = new URLSearchParams({
    officeCode: area.officeCode,
    cityCode: area.cityCode,
  });
  const res = await fetch(`/api/weather?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<WarningResponse>;
}

async function fetchCurrentWeatherData(officeCode: string): Promise<CurrentWeather | null> {
  const res = await fetch(`/api/current-weather?officeCode=${encodeURIComponent(officeCode)}`);
  if (!res.ok) return null;
  return res.json();
}

function warningToState(area: AreaEntry, data: WarningResponse): LocationWarningState {
  return {
    location: area,
    alerts: data.alerts,
    alertLevel: data.alertLevel,
    cachedAt: data.cachedAt,
    isStale: data.isStale,
    publishingOffice: data.publishingOffice,
  };
}

export default function Home() {
  const { theme, toggle } = useTheme();
  const [state, setState] = useState<AppState>({
    home: null,
    office: null,
    homeWarnings: null,
    officeWarnings: null,
    homeLoading: false,
    officeLoading: false,
    homeError: null,
    officeError: null,
    homeWeather: null,
    officeWeather: null,
  });

  // localStorage から復元
  useEffect(() => {
    try {
      const storedHome = localStorage.getItem(LS_HOME_KEY);
      const storedOffice = localStorage.getItem(LS_OFFICE_KEY);
      const home: AreaEntry | null = storedHome ? JSON.parse(storedHome) : null;
      const office: AreaEntry | null = storedOffice ? JSON.parse(storedOffice) : null;
      setState((prev) => ({ ...prev, home, office }));
    } catch {
      // ignore
    }
  }, []);

  const loadWarnings = useCallback(
    async (area: AreaEntry, slot: "home" | "office") => {
      const loadingKey = slot === "home" ? "homeLoading" : "officeLoading";
      const warningsKey = slot === "home" ? "homeWarnings" : "officeWarnings";
      const errorKey = slot === "home" ? "homeError" : "officeError";

      setState((prev) => ({ ...prev, [loadingKey]: true, [errorKey]: null }));
      try {
        const data = await fetchWarnings(area);
        setState((prev) => ({
          ...prev,
          [loadingKey]: false,
          [warningsKey]: warningToState(area, data),
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          [loadingKey]: false,
          [errorKey]: err instanceof Error ? err.message : "データ取得エラー",
        }));
      }
    },
    []
  );

  // 地域設定後に警報と現在の天気を取得
  useEffect(() => {
    if (state.home) {
      loadWarnings(state.home, "home");
      let cancelled = false;
      fetchCurrentWeatherData(state.home.officeCode).then((w) => {
        if (!cancelled) setState((prev) => ({ ...prev, homeWeather: w }));
      });
      return () => { cancelled = true; };
    } else {
      setState((prev) => ({ ...prev, homeWarnings: null, homeError: null, homeWeather: null }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.home, loadWarnings]);

  useEffect(() => {
    if (state.office) {
      loadWarnings(state.office, "office");
      let cancelled = false;
      fetchCurrentWeatherData(state.office.officeCode).then((w) => {
        if (!cancelled) setState((prev) => ({ ...prev, officeWeather: w }));
      });
      return () => { cancelled = true; };
    } else {
      setState((prev) => ({
        ...prev,
        officeWarnings: null,
        officeError: null,
        officeWeather: null,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.office, loadWarnings]);

  const handleSelectHome = useCallback((area: AreaEntry | null) => {
    setState((prev) => ({ ...prev, home: area }));
    if (area) {
      localStorage.setItem(LS_HOME_KEY, JSON.stringify(area));
    } else {
      localStorage.removeItem(LS_HOME_KEY);
    }
  }, []);

  const handleSelectOffice = useCallback((area: AreaEntry | null) => {
    setState((prev) => ({ ...prev, office: area }));
    if (area) {
      localStorage.setItem(LS_OFFICE_KEY, JSON.stringify(area));
    } else {
      localStorage.removeItem(LS_OFFICE_KEY);
    }
  }, []);

  const judgment: JudgmentResult | null =
    state.home || state.office
      ? makeJudgment(
          state.homeWarnings?.alertLevel ?? "none",
          state.officeWarnings?.alertLevel ?? "none"
        )
      : null;

  const isLoading = state.homeLoading || state.officeLoading;
  const cachedAt = state.homeWarnings?.cachedAt ?? state.officeWarnings?.cachedAt;

  const worstLevel = getWorstLevel([
    state.homeWarnings?.alertLevel,
    state.officeWarnings?.alertLevel,
  ]);

  const pageGradient =
    theme === "dark"
      ? PAGE_GRADIENTS_DARK[worstLevel]
      : PAGE_GRADIENTS_LIGHT[worstLevel];

  return (
    <div
      className="flex flex-col min-h-screen relative"
      style={{ background: pageGradient }}
    >
      {/* Dot grid background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, var(--dot-grid) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Theme toggle button */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle theme={theme} toggle={toggle} />
      </div>

      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full relative z-10 flex flex-col justify-center">
        <JudgmentBanner result={judgment} isLoading={isLoading} />

        {cachedAt && (
          <p className="text-xs text-center text-white/35 mt-3 mb-2">
            最終更新:{" "}
            {new Date(cachedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
          </p>
        )}

        {/* Location inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 mb-4">
          <LocationInput
            label="自宅"
            value={state.home}
            onSelect={handleSelectHome}
            placeholder="自宅の地域名を入力"
          />
          <LocationInput
            label="勤務地"
            value={state.office}
            onSelect={handleSelectOffice}
            placeholder="勤務地の地域名を入力"
          />
        </div>

        {/* Weather cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <WeatherCard
            label="自宅"
            state={state.homeWarnings}
            isLoading={state.homeLoading}
            error={state.homeError}
            weather={state.homeWeather}
          />
          <WeatherCard
            label="勤務地"
            state={state.officeWarnings}
            isLoading={state.officeLoading}
            error={state.officeError}
            weather={state.officeWeather}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
