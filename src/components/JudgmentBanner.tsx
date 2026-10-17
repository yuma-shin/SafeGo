"use client";

import React from "react";
import type { JudgmentResult } from "@/types/jma";

interface JudgmentBannerProps {
  result: JudgmentResult | null;
  isLoading: boolean;
}

export default function JudgmentBanner({ result, isLoading }: JudgmentBannerProps) {
  if (isLoading) {
    return (
      <div data-testid="judgment-loading" className="soft-panel judgment animate-pulse" role="status" aria-label="出社可否を確認中">
        <div className="judgment-symbol" />
        <div className="space-y-3 flex-1">
          <div className="h-4 rounded w-2/3" style={{ background: "var(--skeleton-line)" }} />
          <div className="h-3 rounded w-full" style={{ background: "var(--skeleton-line)" }} />
        </div>
      </div>
    );
  }

  const isWarning = result === "stay-home";
  return (
    <div className={`soft-panel judgment${isWarning ? " judgment-warning" : ""}`} role="status">
      <span className="judgment-symbol" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {isWarning ? <><path d="m12 3 10 17H2z" /><path d="M12 9v4m0 3v.01" /></> : result ? <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></> : <><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>}
        </svg>
      </span>
      <div className="min-w-0">
        <p className="judgment-label">COMMUTE STATUS</p>
        <p className={`judgment-title${isWarning ? " text-red-700 dark:text-red-300" : ""}`}>
          {!result ? "地域を設定してください" : isWarning ? "自宅待機" : "通常出社可能"}
        </p>
        <p className="judgment-detail">
          {!result ? "下の欄から、自宅と勤務地の地域を選んではじめましょう。" : isWarning ? <><span className="font-medium text-red-700 dark:text-red-300">警報が発令されています</span><br />自治体の指示に従い、安全を確保してください。</> : "現在、警報は発令されていません。（注意報のみの場合も出社可能です）"}
        </p>
      </div>
    </div>
  );
}
