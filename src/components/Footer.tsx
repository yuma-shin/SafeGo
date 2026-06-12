"use client";

import React from "react";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  return (
    <footer
      className={`sticky bottom-0 relative z-10 w-full px-4 py-3 text-xs text-slate-400 dark:text-white/25 ${className}`}
      style={{ borderTop: "1px solid var(--footer-border)" }}
    >
      <p className="text-center leading-relaxed">
        本アプリが提供する気象情報は参考情報です。最終的な判断はご自身の責任で行ってください。本アプリの情報を利用したことにより生じた損害について、一切の責任を負いません。
      </p>
    </footer>
  );
}
