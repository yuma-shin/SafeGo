"use client";

import React, { useCallback, useEffect, useState } from "react";
import LocationInput from "@/components/LocationInput";
import WeatherCard from "@/components/WeatherCard";
import JudgmentBanner from "@/components/JudgmentBanner";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import PushNotificationButton from "@/components/PushNotificationButton";
import InstallPrompt from "@/components/InstallPrompt";
import { useTheme } from "@/hooks/useTheme";
import { makeJudgment } from "@/lib/judgment";
import type {
  AreaEntry,
  CurrentWeather,
  JudgmentResult,
  LocationWarningState,
  WarningResponse,
} from "@/types/jma";

const LS_HOME_KEY = "wac_home";
const LS_OFFICE_KEY = "wac_office";

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

function BookOpenIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
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

  return (
    <div className="app-shell">
      <header className="site-header anim-fade-in">
        <a href="/" className="brand" aria-label="SafeGo ホーム">
          <span className="brand-symbol" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 14a11 11 0 0 1 22 0q-3 3-7 0-4 3-8 0-4 3-7 0Z" />
              <path d="M16 14v10q0 4 4 4h2" />
              <path d="m28 22-7 2 3 1 1 3Z" />
            </svg>
          </span>
          <span>SafeGo<span className="brand-caption">出社可否チェッカー</span></span>
        </a>
        <nav className="flex items-center gap-2" aria-label="表示とヘルプ">
          {process.env.NEXT_PUBLIC_MANUAL_URL && (
            <a
              href={process.env.NEXT_PUBLIC_MANUAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="マニュアルを開く"
              className="icon-button"
            >
              <BookOpenIcon />
            </a>
          )}
          <ThemeToggle theme={theme} toggle={toggle} />
        </nav>
      </header>

      <main className="main-content">
        <section className="page-intro anim-fade-slide-up" aria-labelledby="page-title">
          <span className="eyebrow">YOUR DAILY WEATHER CHECK</span>
          <h1 id="page-title">今日の出社、<br className="sm:hidden" />大丈夫？</h1>
          <p>自宅と勤務地の天気を確認して、<br className="sm:hidden" />安心できる一日の準備を。</p>
          <div className="intro-route" aria-hidden="true">
            <span>自宅</span><span className="route-line"><i /></span><span>勤務地</span>
          </div>
        </section>
        <div className="anim-fade-slide-up">
          <JudgmentBanner result={judgment} isLoading={isLoading} />
        </div>

        {cachedAt && (
          <p className="updated-at anim-fade-slide-up anim-delay-1">
            最終更新:{" "}
            {new Date(cachedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
          </p>
        )}

        <section className="locations-grid anim-fade-slide-up anim-delay-2" aria-label="自宅と勤務地の気象情報">
          <div className="location-panel">
            <div className="location-setting">
              <LocationInput
                label="自宅"
                value={state.home}
                onSelect={handleSelectHome}
                placeholder="自宅の地域名を入力"
              />
            </div>
            <WeatherCard
              label="自宅"
              state={state.homeWarnings}
              isLoading={state.homeLoading}
              error={state.homeError}
              weather={state.homeWeather}
            />
          </div>
          <div className="location-panel">
            <div className="location-setting">
              <LocationInput
                label="勤務地"
                value={state.office}
                onSelect={handleSelectOffice}
                placeholder="勤務地の地域名を入力"
              />
            </div>
            <WeatherCard
              label="勤務地"
              state={state.officeWarnings}
              isLoading={state.officeLoading}
              error={state.officeError}
              weather={state.officeWeather}
            />
          </div>
        </section>

        <div className="anim-fade-slide-up anim-delay-4">
          <PushNotificationButton home={state.home} office={state.office} />
        </div>
        <div className="anim-fade-slide-up anim-delay-5">
          <InstallPrompt />
        </div>
      </main>

      <Footer />
    </div>
  );
}
