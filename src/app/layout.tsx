import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafeGo — 出社可否チェッカー",
  description:
    "自宅・勤務地の気象警報をリアルタイムに確認し、今日の出社可否を即座に判定する通勤安全アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Prevent theme flash: apply stored preference before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('rc_theme');if(s==='light'){document.documentElement.classList.remove('dark')}else if(!s&&!window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className="min-h-screen antialiased text-slate-800 dark:text-white"
        style={{ background: "var(--body-bg)" }}
      >
        {children}
      </body>
    </html>
  );
}
