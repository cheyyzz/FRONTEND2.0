import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import type {
  LoginCredentials,
  RegisterCredentials,
  TopicMastery,
  User,
  UserRole,
} from '../types';

interface FirestoreUserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  masteryByTopic: Record<string, TopicMastery>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const BOOTSTRAPPED_TEACHER_EMAIL = '12410394@student.unklab.ac.id';

function timestampToIso(ts?: Timestamp): string {
  return ts ? ts.toDate().toISOString() : new Date().toISOString();
}

function normalizeUserDoc(data: FirestoreUserDoc): User {
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    masteryByTopic: data.masteryByTopic ?? {},
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

/**
 * Fetches an existing Firestore user profile or provisions a new one on first login.
 */
export async function getOrCreateUserProfile(
  fbUser: FirebaseAuthUser,
  preferredDisplayName?: string
): Promise<User> {
  const path = `users/${fbUser.uid}`;
  const userRef = doc(db, 'users', fbUser.uid);

  let existingSnap;
  try {
    existingSnap = await getDoc(userRef);
  } catch (error: unknown) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (existingSnap.exists()) {
    const rawData = existingSnap.data() as FirestoreUserDoc;
    return normalizeUserDoc(rawData);
  }

  const safeEmail = (fbUser.email ?? 'user@onlinequiz.local').slice(0, 160);
  const rawName = (preferredDisplayName || fbUser.displayName || safeEmail.split('@')[0] || 'Student').trim();
  const safeDisplayName = rawName.length >= 2 ? rawName.slice(0, 80) : `${rawName} User`.slice(0, 80);

  const assignedRole: UserRole =
    fbUser.email === BOOTSTRAPPED_TEACHER_EMAIL && fbUser.emailVerified ? 'teacher' : 'student';

  const newUserPayload = {
    uid: fbUser.uid,
    email: safeEmail,
    displayName: safeDisplayName,
    role: assignedRole,
    masteryByTopic: {} as Record<string, TopicMastery>,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(userRef, newUserPayload);
  } catch (error: unknown) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    uid: fbUser.uid,
    email: safeEmail,
    displayName: safeDisplayName,
    role: assignedRole,
    masteryByTopic: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Registers a new account with email/password and creates the Firestore profile. */
export async function registerWithEmail(credentials: RegisterCredentials): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    credentials.email.trim(),
    credentials.password
  );
  const trimmedName = credentials.displayName.trim().slice(0, 80);
  await updateProfile(userCredential.user, { displayName: trimmedName });
  return getOrCreateUserProfile(userCredential.user, trimmedName);
}

/** Signs in an existing user with email and password. */
export async function loginWithEmail(credentials: LoginCredentials): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    credentials.email.trim(),
    credentials.password
  );
  return getOrCreateUserProfile(userCredential.user);
}

/** Signs in using Google OAuth popup and syncs Firestore profile. */
export async function loginWithGooglePopup(): Promise<User> {
  const userCredential = await signInWithPopup(auth, googleProvider);
  return getOrCreateUserProfile(userCredential.user);
}

/** Sends a Firebase password reset email. */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/** Signs out the current authenticated user. */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/** Updates the current user's displayName in both Firebase Auth and Firestore. */
export async function updateUserDisplayNameProfile(
  uid: string,
  displayName: string
): Promise<void> {
  const trimmed = displayName.trim().slice(0, 80);
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: trimmed });
  }
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: trimmed,
      updatedAt: serverTimestamp(),
    });
  } catch (error: unknown) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/** Returns the current Firebase Auth JWT ID token for authenticated REST API calls. */
export async function getCurrentIdToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}
