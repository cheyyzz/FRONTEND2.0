import type { AuthFormErrors, UserRole } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates email formatting and returns a user-friendly error message or undefined. */
export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Email wajib diisi.';
  }
  if (trimmed.length > 160) {
    return 'Email maksimal 160 karakter.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Format email tidak valid.';
  }
  return undefined;
}

/** Validates password length for authentication forms. */
export function validatePassword(password: string): string | undefined {
  if (!password) {
    return 'Kata sandi wajib diisi.';
  }
  if (password.length < 6) {
    return 'Kata sandi minimal 6 karakter.';
  }
  return undefined;
}

/** Validates user display name (aligned with Firestore rule size 2..80). */
export function validateDisplayName(displayName: string): string | undefined {
  const trimmed = displayName.trim();
  if (!trimmed) {
    return 'Nama lengkap wajib diisi.';
  }
  if (trimmed.length < 2) {
    return 'Nama lengkap minimal 2 karakter.';
  }
  if (trimmed.length > 80) {
    return 'Nama lengkap maksimal 80 karakter.';
  }
  return undefined;
}

/** Validates login form fields and returns an error dictionary. */
export function validateLoginForm(email: string, password: string): AuthFormErrors {
  const errors: AuthFormErrors = {};
  const emailErr = validateEmail(email);
  const passwordErr = validatePassword(password);

  if (emailErr) errors.email = emailErr;
  if (passwordErr) errors.password = passwordErr;
  return errors;
}

/** Validates registration form fields including password confirmation. */
export function validateRegisterForm(
  displayName: string,
  email: string,
  password: string,
  confirmPassword: string
): AuthFormErrors {
  const errors: AuthFormErrors = {};
  const nameErr = validateDisplayName(displayName);
  const emailErr = validateEmail(email);
  const passwordErr = validatePassword(password);

  if (nameErr) errors.displayName = nameErr;
  if (emailErr) errors.email = emailErr;
  if (passwordErr) errors.password = passwordErr;
  if (!confirmPassword) {
    errors.confirmPassword = 'Konfirmasi kata sandi wajib diisi.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Konfirmasi kata sandi tidak cocok.';
  }

  return errors;
}

/** Checks whether a user role is authorized for a route's allowedRoles list. */
export function canAccessRole(
  userRole: UserRole | null | undefined,
  allowedRoles?: ReadonlyArray<UserRole>
): boolean {
  if (!userRole) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
}

/** Returns the default home dashboard path for a given role. */
export function getDefaultRouteForRole(role: UserRole): string {
  return role === 'teacher' ? '/teacher/dashboard' : '/dashboard';
}

/** Maps Firebase Auth error codes to clear Indonesian UI messages. */
export function mapFirebaseAuthError(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan. Hubungi administrator.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau kata sandi tidak sesuai.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan masuk atau gunakan Reset Kata Sandi.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Coba lagi beberapa menit lagi.';
    case 'auth/popup-closed-by-user':
      return 'Jendela masuk Google ditutup sebelum proses selesai.';
    case 'auth/popup-blocked':
      return 'Popup login Google diblokir oleh browser. Izinkan popup untuk domain ini lalu coba lagi.';
    case 'auth/cancelled-popup-request':
      return 'Permintaan login popup sebelumnya dibatalkan. Silakan klik tombol Google sekali lagi.';
    case 'auth/unauthorized-domain':
      return 'Domain aplikasi ini belum masuk Authorized Domains di Firebase Console (Authentication → Settings → Authorized domains).';
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Metode Email/Password belum diaktifkan di Firebase Console (Authentication → Sign-in method → Email/Password). Silakan aktifkan di Console atau gunakan tombol "Lanjutkan dengan Google".';
    case 'auth/admin-restricted-operation':
      return 'Operasi autentikasi ini dibatasi oleh pengaturan project Firebase.';
    case 'auth/account-exists-with-different-credential':
      return 'Email ini sudah terdaftar dengan metode login berbeda (misalnya Google). Silakan masuk dengan metode tersebut.';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke layanan autentikasi. Periksa koneksi internet Anda.';
    case 'auth/internal-error':
      return 'Terjadi kesalahan internal pada layanan Firebase Auth (auth/internal-error). Periksa konfigurasi API key dan Sign-in method di Firebase Console.';
    default:
      return `Terjadi kendala saat autentikasi (${errorCode || 'unknown'}). Silakan coba kembali.`;
  }
}
