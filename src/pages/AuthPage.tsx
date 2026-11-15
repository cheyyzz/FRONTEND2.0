import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthFormCard } from '../components/AuthFormCard';
import { useAuth } from '../hooks/useAuth';
import { getDefaultRouteForRole } from '../utils/authValidation';

interface LocationState {
  from?: string;
}

/**
 * Authentication page redirecting signed-in users to their role dashboard.
 */
export function AuthPage() {
  const { firebaseUid, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  useEffect(() => {
    if (!loading && firebaseUid && userProfile) {
      const target =
        state?.from && state.from !== '/login'
          ? state.from
          : getDefaultRouteForRole(userProfile.role);
      navigate(target, { replace: true });
    }
  }, [loading, firebaseUid, userProfile, navigate, state?.from]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-4xl items-center gap-10 lg:grid-cols-12">
        <div className="order-last space-y-4 lg:order-first lg:col-span-5">
          <p className="text-xs font-semibold text-sky-700">Autentikasi Terlindungi</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Akses Personal Mahasiswa &amp; Dosen
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Riwayat kuis, tingkat kesulitan adaptif, dan rencana belajar tersimpan aman di Cloud
            Firestore berdasarkan akun Anda.
          </p>
          <ul className="space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-600">
            <li>· Mahasiswa dapat mendaftar mandiri dengan Email atau Google.</li>
            <li>· Fitur Reset Kata Sandi mengirim tautan resmi melalui Firebase Auth.</li>
            <li>· Akses rute Dosen dilindungi oleh Firebase Security Rules dan RBAC.</li>
          </ul>
        </div>

        <div className="order-first flex justify-center lg:order-last lg:col-span-7">
          <AuthFormCard />
        </div>
      </div>
    </main>
  );
}
