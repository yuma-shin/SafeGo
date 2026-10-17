"use client";

import React from "react";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  return (
    <footer
      className={`site-footer sticky bottom-0 z-10 w-full backdrop-blur-md ${className}`}
    >
      <p className="footer-content">
        本アプリが提供する気象情報は参考情報です。最終的な判断はご自身の責任で行ってください。本アプリの情報を利用したことにより生じた損害について、一切の責任を負いません。
      </p>
    </footer>
  );
}
