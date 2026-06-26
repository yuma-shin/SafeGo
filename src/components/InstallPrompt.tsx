"use client";

import { useEffect, useState } from "react";

const GLASS = "backdrop-blur-md border border-slate-200 dark:border-white/[0.12]";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setShow(isIOS && !isStandalone);
  }, []);

  if (!show) return null;

  return (
    <div
      className={`rounded-2xl px-4 py-3 mt-3 ${GLASS}`}
      style={{ background: "var(--card-bg-muted)" }}
    >
      <p className="text-xs text-slate-500 dark:text-white/40 text-center leading-relaxed">
        iOSで通知を受け取るには、Safariの共有ボタン（
        <span className="font-semibold text-slate-600 dark:text-white/60">□↑</span>
        ）から「ホーム画面に追加」を選択してください。
      </p>
    </div>
  );
}
