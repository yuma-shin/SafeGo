"use client";

import React from "react";
import type { JudgmentResult } from "@/types/jma";

interface JudgmentBannerProps {
  result: JudgmentResult | null;
  isLoading: boolean;
}

const GLASS = "backdrop-blur-md border border-slate-200 dark:border-white/[0.12]";

export default function JudgmentBanner({
  result,
  isLoading,
}: JudgmentBannerProps) {
  if (isLoading) {
    return (
      <div
        data-testid="judgment-loading"
        className={`rounded-2xl p-6 animate-pulse ${GLASS} flex items-center justify-center`}
        style={{ background: "var(--card-bg-muted)" }}
      >
        <div className="h-6 rounded w-48" style={{ background: "var(--skeleton-line)" }} />
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className={`rounded-2xl p-6 text-center ${GLASS}`}
        style={{ background: "var(--banner-default-bg)" }}
      >
        <p className="text-slate-400 dark:text-white/40 text-base font-medium">
          地域を設定してください
        </p>
      </div>
    );
  }

  if (result === "stay-home") {
    return (
      <div
        className={`rounded-2xl p-6 text-center ${GLASS}`}
        style={{
          background: "var(--banner-red-bg)",
          borderColor: "var(--banner-red-border)",
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <p className="text-xl font-bold text-red-600 dark:text-red-300">自宅待機</p>
        </div>
        <p className="text-sm font-semibold text-red-600/80 dark:text-red-300/80 mb-1">
          特別警報が発令されています
        </p>
        <p className="text-sm text-red-600/70 dark:text-red-400/70">
          自治体の指示に従い、安全を確保してください。
        </p>
      </div>
    );
  }

  if (result === "telework") {
    return (
      <div
        className={`rounded-2xl p-6 text-center ${GLASS}`}
        style={{
          background: "var(--banner-orange-bg)",
          borderColor: "var(--banner-orange-border)",
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <p className="text-xl font-bold text-orange-600 dark:text-orange-300">
            自宅待機または在宅勤務を推奨
          </p>
        </div>
        <p className="text-sm text-orange-600/70 dark:text-orange-300/70">
          警報が発令されています。出社は控え、在宅勤務をご検討ください。
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-6 text-center ${GLASS}`}
      style={{
        background: "var(--banner-green-bg)",
        borderColor: "var(--banner-green-border)",
      }}
    >
      <div className="flex items-center justify-center gap-3 mb-2">
        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-300">通常出社可能</p>
      </div>
      <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70">
        現在、警報は発令されていません。（注意報のみの場合も出社可能です）
      </p>
    </div>
  );
}
