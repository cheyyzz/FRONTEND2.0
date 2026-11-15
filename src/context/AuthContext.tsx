import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { FirebaseError } from 'firebase/app';
import { onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  getOrCreateUserProfile,
  loginWithEmail,
  loginWithGooglePopup,
  logoutUser,
  registerWithEmail,
  sendPasswordReset,
  updateUserDisplayNameProfile,
} from '../services/authService';
import type {
  AuthContextValue,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../types';
import { mapFirebaseAuthError } from '../utils/authValidation';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function hasErrorCode(error: unknown): error is { code: string; message?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

function extractAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return mapFirebaseAuthError(error.code);
  }
  if (hasErrorCode(error) && error.code.startsWith('auth/')) {
    return mapFirebaseAuthError(error.code);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Terjadi kesalahan autentikasi.';
}

/**
 * Provides Firebase Authentication state, Firestore RBAC profile, and auth actions.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseAuthUser | null) => {
      if (!fbUser) {
        setFirebaseUid(null);
        setEmailVerified(false);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setFirebaseUid(fbUser.uid);
      setEmailVerified(fbUser.emailVerified);

      try {
        const profile = await getOrCreateUserProfile(fbUser);
        setUserProfile(profile);
      } catch (error: unknown) {
        setAuthError(extractAuthErrorMessage(error));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const profile = await loginWithEmail(credentials);
      setUserProfile(profile);
      return true;
    } catch (error: unknown) {
      setAuthError(extractAuthErrorMessage(error));
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<boolean> => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const profile = await registerWithEmail(credentials);
      setUserProfile(profile);
      return true;
    } catch (error: unknown) {
      setAuthError(extractAuthErrorMessage(error));
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const profile = await loginWithGooglePopup();
      setUserProfile(profile);
      return true;
    } catch (error: unknown) {
      setAuthError(extractAuthErrorMessage(error));
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setActionLoading(true);
    setAuthError(null);
    try {
      await logoutUser();
      setUserProfile(null);
      setFirebaseUid(null);
      setEmailVerified(false);
    } catch (error: unknown) {
      setAuthError(extractAuthErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setActionLoading(true);
    setAuthError(null);
    try {
      await sendPasswordReset(email);
      return true;
    } catch (error: unknown) {
      setAuthError(extractAuthErrorMessage(error));
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const updateDisplayName = useCallback(
    async (displayName: string): Promise<boolean> => {
      if (!firebaseUid || !userProfile) return false;
      setActionLoading(true);
      setAuthError(null);
      try {
        await updateUserDisplayNameProfile(firebaseUid, displayName);
        setUserProfile({
          ...userProfile,
          displayName: displayName.trim().slice(0, 80),
          updatedAt: new Date().toISOString(),
        });
        return true;
      } catch (error: unknown) {
        setAuthError(extractAuthErrorMessage(error));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [firebaseUid, userProfile]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      userProfile,
      firebaseUid,
      emailVerified,
      loading,
      actionLoading,
      authError,
      login,
      register,
      loginWithGoogle,
      logout,
      resetPassword,
      updateDisplayName,
      clearError,
    }),
    [
      userProfile,
      firebaseUid,
      emailVerified,
      loading,
      actionLoading,
      authError,
      login,
      register,
      loginWithGoogle,
      logout,
      resetPassword,
      updateDisplayName,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
