import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-thin text-slate-300 dark:text-white/20">404</p>
      <p className="text-lg font-medium text-slate-600 dark:text-white/60">
        ページが見つかりません
      </p>
      <Link
        href="/"
        className="mt-2 text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
      >
        トップへ戻る
      </Link>
    </div>
  );
}
