"use client";

import React from "react";
import PrefectureSilhouette from "@/components/PrefectureSilhouette";
import WeatherIcon from "@/components/WeatherIcon";
import type {
  AlertLevel,
  CurrentWeather,
  LocationWarningState,
} from "@/types/jma";

interface WeatherCardProps {
  label: string;
  state: LocationWarningState | null;
  isLoading: boolean;
  error: string | null;
  weather?: CurrentWeather | null;
}

const levelAccent: Record<AlertLevel, string> = {
  none: "bg-neutral-300/30 dark:bg-neutral-500/20",
  advisory: "bg-amber-400/50",
  warning: "bg-orange-500/60",
  "critical-warning": "bg-red-500/70",
  "special-warning": "bg-rose-600/80",
};

const levelLabel: Record<AlertLevel, string> = {
  none: "警報なし",
  advisory: "注意報あり",
  warning: "警報あり",
  "critical-warning": "危険警報あり（レベル4）",
  "special-warning": "特別警報あり（レベル5）",
};

const GLASS = "weather-card";

export default function WeatherCard({
  label,
  state,
  isLoading,
  error,
  weather = null,
}: WeatherCardProps) {
  if (isLoading) {
    return (
      <div
        data-testid="skeleton"
        className={`animate-pulse ${GLASS}`}
        style={{ background: "var(--card-bg)" }}
      >
        <div className="p-4 space-y-2">
          <div className="h-3 rounded w-12" style={{ background: "var(--skeleton-line)" }} />
          <div className="h-6 rounded w-3/4" style={{ background: "var(--skeleton-line)" }} />
          <div className="h-14 rounded w-full" style={{ background: "var(--skeleton-line)" }} />
          <div className="h-4 rounded w-1/2" style={{ background: "var(--skeleton-line)" }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-5 ${GLASS}`}
        style={{ background: "var(--card-error-bg)" }}
      >
        <p className="text-base font-medium text-slate-400 dark:text-neutral-300 mb-1">{label}</p>
        <p className="text-red-600 dark:text-red-300 text-base">{error}</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div
        className={`weather-card-empty ${GLASS}`}
        style={{ background: "var(--card-bg-muted)" }}
      >
        <svg className="empty-location-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" />
        </svg>
        <p className="text-sm text-slate-500 dark:text-neutral-300">{label}の天気・警報</p>
        <p className="text-slate-400 dark:text-neutral-300 text-sm">未設定</p>
      </div>
    );
  }

  const { location, alerts, alertLevel, cachedAt, isStale, publishingOffice } =
    state;
  const activeAlerts = alerts.filter(
    (a) => a.status !== "解除" && a.status !== "発表警報・注意報はなし",
  );
  const warningAlerts = activeAlerts.filter((a) => a.level !== "advisory");
  const advisoryAlerts = activeAlerts.filter((a) => a.level === "advisory");

  return (
    <div
      className={GLASS}
      style={{ background: "var(--card-bg)" }}
    >
      <div className="prefecture-art" aria-hidden="true">
        <PrefectureSilhouette officeCode={location.officeCode} size={190} />
      </div>

      {/* Alert level accent stripe */}
      <div className={`h-1 ${levelAccent[alertLevel]}`} />

      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-base font-semibold text-slate-500 dark:text-neutral-300">{label}</span>
          <span
            className="alert-badge"
            data-level={alertLevel}
          >
            {levelLabel[alertLevel]}
          </span>
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
          {location.cityName}
        </p>
        <p className="text-sm text-slate-500 dark:text-neutral-300 mt-0.5">{location.officeName}</p>
      </div>

      {/* Weather section */}
      {weather && (
        <div
          data-testid="weather-temp"
          className="weather-observation px-4 py-4 flex items-center gap-4"
        >
          <WeatherIcon emoji={weather.emoji} />
          <div>
            <p className="weather-temperature text-slate-800 dark:text-white leading-tight">
              {weather.temp !== null ? `${weather.temp}℃` : "--℃"}
            </p>
            <p className="text-base text-slate-500 dark:text-neutral-300">{weather.description}</p>
            <p className="text-sm text-slate-400 dark:text-neutral-300 mt-0.5">
              明日&nbsp;
              {weather.tempMax !== null ? `H:${weather.tempMax}℃` : "H:--"}
              &nbsp;
              {weather.tempMin !== null ? `L:${weather.tempMin}℃` : "L:--"}
            </p>
          </div>
        </div>
      )}

      {/* Alerts section */}
      <div className="px-4 py-3">
        {warningAlerts.length > 0 && (
          <div data-testid="section-warnings" className="mb-3">
            <p className="text-sm font-bold text-red-600 dark:text-red-300/70 tracking-[0.15em] uppercase mb-1.5">
              警報
            </p>
            <ul className="space-y-1.5">
              {warningAlerts.map((a) => (
                <li
                  key={a.code}
                  className="flex items-center gap-2 text-base text-slate-700 dark:text-white/80"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {a.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {advisoryAlerts.length > 0 && (
          <div data-testid="section-advisories">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300/70 tracking-[0.15em] uppercase mb-1.5">
              注意報
            </p>
            <ul className="space-y-1.5">
              {advisoryAlerts.map((a) => (
                <li
                  key={a.code}
                  className="flex items-center gap-2 text-base text-slate-700 dark:text-white/80"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {a.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeAlerts.length === 0 && (
          <p className="text-base text-slate-400 dark:text-neutral-300 text-center py-1">
            警報・注意報なし
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center gap-2">
        {publishingOffice && (
          <p className="text-sm text-slate-400 dark:text-neutral-300 truncate">
            情報提供: {publishingOffice}
          </p>
        )}
        <a
          href={`https://www.jma.go.jp/bosai/#pattern=default&area_type=class20s&area_code=${location.cityCode}&lang=ja`}
          target="_blank"
          rel="noopener noreferrer"
          className="weather-link text-sm ml-auto flex-shrink-0"
        >
          気象庁サイト↗
        </a>
      </div>

      {isStale && (
        <div className="px-4 pb-3">
          <p className="text-sm text-amber-700 dark:text-amber-300/60 border border-amber-400/40 dark:border-amber-400/20 rounded px-2 py-1">
            古いデータ（更新:{" "}
            {new Date(cachedAt).toLocaleString("ja-JP", {
              timeZone: "Asia/Tokyo",
            })}
            ）
          </p>
        </div>
      )}
    </div>
  );
}
