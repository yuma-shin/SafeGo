import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="not-found soft-panel anim-fade-slide-up">
        <p className="eyebrow mb-4">SafeGo</p>
        <p className="not-found-code" aria-hidden="true">404</p>
        <h1 className="text-lg font-medium mt-5 mb-2">
          ページが見つかりません
        </h1>
        <p className="text-sm text-slate-500 dark:text-neutral-300 mb-7">トップページから、もう一度はじめましょう。</p>
        <Link href="/" className="ui-button ui-button-primary">
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
