import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
}

function getNavLinkClassName(isActive: boolean): string {
  return [
    'whitespace-nowrap shrink-0 text-sm font-medium transition-colors duration-150',
    isActive
      ? 'text-sky-700 underline decoration-sky-600 decoration-2 underline-offset-8'
      : 'text-slate-600 hover:text-slate-900',
  ].join(' ');
}

function getMobileNavClassName(isActive: boolean): string {
  return [
    'flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-sky-50 text-sky-700'
      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ');
}

/**
 * Responsive 3-zone top navigation bar with role-aware links and mobile drawer.
 */
export function Navbar() {
  const { userProfile, firebaseUid, logout, actionLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const isAuthenticated = Boolean(firebaseUid && userProfile);
  const isTeacher = userProfile?.role === 'teacher';

  const navItems: NavItem[] = isAuthenticated
    ? isTeacher
      ? [
          { to: '/', label: 'Beranda' },
          { to: '/teacher/dashboard', label: 'Dashboard Dosen' },
          { to: '/dashboard', label: 'Mode Mahasiswa' },
        ]
      : [
          { to: '/', label: 'Beranda' },
          { to: '/dashboard', label: 'Dashboard' },
        ]
    : [
        { to: '/', label: 'Beranda' },
        { to: '/login', label: 'Masuk' },
      ];

  const handleLogout = async (): Promise<void> => {
    setMobileOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-element brand wordmark */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="shrink-0 whitespace-nowrap text-lg font-bold tracking-tight text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
        >
          OnlineQuiz
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Navigasi utama">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => getNavLinkClassName(isActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Single primary action or account sign-out */}
        <div className="hidden shrink-0 items-center gap-4 md:flex">
          {isAuthenticated && userProfile ? (
            <div className="flex items-center gap-4">
              <span className="max-w-[180px] truncate text-xs text-slate-600">
                {userProfile.displayName} · {userProfile.role === 'teacher' ? 'Dosen' : 'Mahasiswa'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={actionLoading}
                className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-60"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Keluar
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex min-h-[40px] shrink-0 items-center whitespace-nowrap rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              Mulai Belajar
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation-drawer"
          aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 md:hidden"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Responsive mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-navigation-drawer"
          className="border-t border-slate-200 bg-white px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Navigasi seluler">
            {(isAuthenticated ? navItems : [{ to: '/', label: 'Beranda' }]).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => getMobileNavClassName(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 border-t border-slate-200 pt-4">
            {isAuthenticated && userProfile ? (
              <div className="flex flex-col gap-3">
                <p className="px-3 text-xs text-slate-600">
                  Masuk sebagai <strong className="text-slate-900">{userProfile.displayName}</strong> ·{' '}
                  {userProfile.role === 'teacher' ? 'Dosen' : 'Mahasiswa'}
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={actionLoading}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Mulai Belajar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
