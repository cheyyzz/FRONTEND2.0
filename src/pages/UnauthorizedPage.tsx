import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getDefaultRouteForRole } from '../utils/authValidation';

/**
 * Access denied page shown when an authenticated user lacks the required role.
 */
export function UnauthorizedPage() {
  const { userProfile } = useAuth();
  const safeHome = userProfile ? getDefaultRouteForRole(userProfile.role) : '/';

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4 py-12">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Akses Dibatasi (403)</h1>
        <p className="mt-2 text-sm text-slate-600">
          Halaman yang Anda tuju hanya dapat diakses oleh peran yang sesuai. Peran akun Anda saat ini adalah{' '}
          <strong className="text-slate-900">{userProfile?.role ?? 'tamu'}</strong>.
        </p>
        <div className="mt-6">
          <Link
            to={safeHome}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
          >
            Kembali ke Dashboard Saya
          </Link>
        </div>
      </div>
    </main>
  );
}
