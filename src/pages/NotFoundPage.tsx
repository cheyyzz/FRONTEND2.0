import { Link } from 'react-router-dom';

/**
 * Fallback 404 page for unmatched routes.
 */
export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4 py-12">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="font-mono text-sm font-semibold text-sky-700 tabular-nums">404</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Halaman Tidak Ditemukan</h1>
        <p className="mt-2 text-sm text-slate-600">
          Rute yang Anda minta tidak tersedia di aplikasi OnlineQuiz.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
