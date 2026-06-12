"use client";

import React from "react";
import PrefectureSilhouette from "@/components/PrefectureSilhouette";
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
  none: "from-emerald-500/50 to-transparent",
  advisory: "from-amber-400/50 to-transparent",
  warning: "from-orange-500/60 to-transparent",
  "critical-warning": "from-red-500/70 to-transparent",
  "special-warning": "from-rose-600/80 to-transparent",
};

const levelBadgeClass: Record<AlertLevel, string> = {
  none: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border border-emerald-500/30",
  advisory: "bg-amber-500/20 text-amber-700 dark:text-amber-200 border border-amber-400/30",
  warning: "bg-orange-500/20 text-orange-700 dark:text-orange-200 border border-orange-500/30",
  "critical-warning": "bg-red-500/20 text-red-700 dark:text-red-200 border border-red-500/30",
  "special-warning": "bg-rose-600/30 text-rose-700 dark:text-rose-100 border border-rose-500/40",
};

const levelLabel: Record<AlertLevel, string> = {
  none: "警報なし",
  advisory: "注意報あり",
  warning: "警報あり",
  "critical-warning": "特定警報あり",
  "special-warning": "特別警報あり",
};

const GLASS = "backdrop-blur-md border border-slate-200 dark:border-white/[0.12]";

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
        className={`rounded-2xl animate-pulse ${GLASS}`}
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
        className={`rounded-2xl p-4 ${GLASS}`}
        style={{ background: "var(--card-error-bg)" }}
      >
        <p className="text-sm font-medium text-slate-400 dark:text-white/60 mb-1">{label}</p>
        <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div
        className={`rounded-2xl p-4 ${GLASS}`}
        style={{ background: "var(--card-bg-muted)" }}
      >
        <p className="text-sm font-medium text-slate-400 dark:text-white/60 mb-1">{label}</p>
        <p className="text-slate-400 dark:text-white/30 text-sm">未設定</p>
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
      className={`rounded-2xl overflow-hidden relative ${GLASS}`}
      style={{ background: "var(--card-bg)" }}
    >
      {/* Background prefecture silhouette */}
      <div
        className="absolute inset-y-0 right-0 flex items-center pointer-events-none"
        style={{ transform: "translateX(22%)" }}
      >
        <PrefectureSilhouette officeCode={location.officeCode} size={190} />
      </div>

      {/* Alert level accent stripe */}
      <div className={`h-1 bg-gradient-to-r ${levelAccent[alertLevel]}`} />

      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-500 dark:text-white/60">{label}</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelBadgeClass[alertLevel]}`}
          >
            {levelLabel[alertLevel]}
          </span>
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
          {location.cityName}
        </p>
        <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{location.officeName}</p>
      </div>

      {/* Weather section */}
      {weather && (
        <div
          data-testid="weather-temp"
          className="px-4 py-3 flex items-center gap-4 border-y border-slate-100 dark:border-white/[0.08]"
        >
          <span className="text-4xl leading-none select-none">
            {weather.emoji}
          </span>
          <div>
            <p className="text-3xl font-thin text-slate-800 dark:text-white leading-tight">
              {weather.temp !== null ? `${weather.temp}℃` : "--℃"}
            </p>
            <p className="text-sm text-slate-500 dark:text-white/55">{weather.description}</p>
            <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">
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
            <p className="text-[10px] font-bold text-red-600 dark:text-red-300/70 tracking-[0.15em] uppercase mb-1.5">
              警報
            </p>
            <ul className="space-y-1.5">
              {warningAlerts.map((a) => (
                <li
                  key={a.code}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/80"
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
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300/70 tracking-[0.15em] uppercase mb-1.5">
              注意報
            </p>
            <ul className="space-y-1.5">
              {advisoryAlerts.map((a) => (
                <li
                  key={a.code}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/80"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {a.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeAlerts.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-white/25 text-center py-1">
            警報・注意報なし
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center gap-2">
        {publishingOffice && (
          <p className="text-xs text-slate-400 dark:text-white/30 truncate">
            情報提供: {publishingOffice}
          </p>
        )}
        <a
          href={`https://www.jma.go.jp/bosai/#pattern=default&area_type=class20s&area_code=${location.cityCode}&lang=ja`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-600/80 hover:text-sky-600 dark:text-sky-400/60 dark:hover:text-sky-400 transition-colors ml-auto flex-shrink-0"
        >
          気象庁サイト↗
        </a>
      </div>

      {isStale && (
        <div className="px-4 pb-3">
          <p className="text-xs text-amber-700 dark:text-amber-300/60 border border-amber-400/40 dark:border-amber-400/20 rounded px-2 py-1">
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
