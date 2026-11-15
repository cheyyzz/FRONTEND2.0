import { useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, LogIn, Mail, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { AuthFormErrors, AuthMode } from '../types';
import {
  validateEmail,
  validateLoginForm,
  validateRegisterForm,
} from '../utils/authValidation';

interface AuthFormCardProps {
  onAuthSuccess?: () => void;
}

/**
 * Tabbed authentication card handling Login, Register, Password Reset, and Google Sign-In.
 */
export function AuthFormCard({ onAuthSuccess }: AuthFormCardProps) {
  const {
    login,
    register,
    loginWithGoogle,
    resetPassword,
    actionLoading,
    authError,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<AuthFormErrors>({});
  const [resetSentMessage, setResetSentMessage] = useState<string | null>(null);

  const switchMode = (nextMode: AuthMode): void => {
    setMode(nextMode);
    setFieldErrors({});
    setResetSentMessage(null);
    clearError();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setResetSentMessage(null);
    clearError();

    if (mode === 'login') {
      const errors = validateLoginForm(email, password);
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) return;

      const ok = await login({ email, password });
      if (ok && onAuthSuccess) onAuthSuccess();
      return;
    }

    if (mode === 'register') {
      const errors = validateRegisterForm(displayName, email, password, confirmPassword);
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) return;

      const ok = await register({ displayName, email, password });
      if (ok && onAuthSuccess) onAuthSuccess();
      return;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setFieldErrors({ email: emailErr });
      return;
    }
    setFieldErrors({});

    const sent = await resetPassword(email);
    if (sent) {
      setResetSentMessage(
        `Tautan reset kata sandi telah dikirim ke ${email.trim()}. Periksa kotak masuk atau folder spam Anda.`
      );
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    setResetSentMessage(null);
    clearError();
    const ok = await loginWithGoogle();
    if (ok && onAuthSuccess) onAuthSuccess();
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Mode selector tabs */}
      <div
        className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
        role="tablist"
        aria-label="Mode autentikasi"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          onClick={() => switchMode('login')}
          className={`min-h-[40px] whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === 'login'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Masuk
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'register'}
          onClick={() => switchMode('register')}
          className={`min-h-[40px] whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === 'register'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Daftar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'reset'}
          onClick={() => switchMode('reset')}
          className={`min-h-[40px] whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === 'reset'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Reset Sandi
        </button>
      </div>

      <div className="mt-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {mode === 'login' && 'Masuk ke OnlineQuiz'}
          {mode === 'register' && 'Buat Akun Mahasiswa'}
          {mode === 'reset' && 'Reset Kata Sandi'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {mode === 'login' && 'Lanjutkan latihan kuis adaptif dan pantau capaian belajar Anda.'}
          {mode === 'register' && 'Akun baru terdaftar sebagai Mahasiswa secara otomatis dan aman.'}
          {mode === 'reset' && 'Masukkan alamat email terdaftar untuk menerima tautan pemulihan.'}
        </p>
      </div>

      {authError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <span>{authError}</span>
        </div>
      )}

      {resetSentMessage && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>{resetSentMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        {mode === 'register' && (
          <div>
            <label htmlFor="auth-display-name" className="block text-xs font-semibold text-slate-700">
              Nama Lengkap
            </label>
            <input
              id="auth-display-name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Contoh: Nadya Putri"
              aria-invalid={Boolean(fieldErrors.displayName)}
              className="mt-1.5 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            />
            {fieldErrors.displayName && (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.displayName}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700">
            Alamat Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@kampus.ac.id"
            aria-invalid={Boolean(fieldErrors.email)}
            className="mt-1.5 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        {mode !== 'reset' && (
          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700">
              Kata Sandi
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              aria-invalid={Boolean(fieldErrors.password)}
              className="mt-1.5 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.password}</p>
            )}
          </div>
        )}

        {mode === 'register' && (
          <div>
            <label htmlFor="auth-confirm-password" className="block text-xs font-semibold text-slate-700">
              Konfirmasi Kata Sandi
            </label>
            <input
              id="auth-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              className="mt-1.5 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={actionLoading}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-60"
        >
          {mode === 'login' && <LogIn className="h-4 w-4" aria-hidden="true" />}
          {mode === 'register' && <UserPlus className="h-4 w-4" aria-hidden="true" />}
          {mode === 'reset' && <KeyRound className="h-4 w-4" aria-hidden="true" />}
          <span>
            {actionLoading
              ? 'Memproses...'
              : mode === 'login'
                ? 'Masuk dengan Email'
                : mode === 'register'
                  ? 'Daftar Akun'
                  : 'Kirim Tautan Reset'}
          </span>
        </button>
      </form>

      {mode !== 'reset' && (
        <>
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-500">atau</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={actionLoading}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-60"
          >
            <Mail className="h-4 w-4 text-sky-600" aria-hidden="true" />
            <span>Lanjutkan dengan Google</span>
          </button>
        </>
      )}
    </div>
  );
}
