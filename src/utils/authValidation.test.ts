import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessRole,
  getDefaultRouteForRole,
  mapFirebaseAuthError,
  validateDisplayName,
  validateEmail,
  validateLoginForm,
  validatePassword,
  validateRegisterForm,
} from './authValidation';

test('validateEmail rejects empty and malformed emails and accepts valid ones', () => {
  assert.ok(validateEmail(''));
  assert.ok(validateEmail('not-an-email'));
  assert.equal(validateEmail('mahasiswa@kampus.ac.id'), undefined);
});

test('validatePassword enforces minimum 6 characters', () => {
  assert.ok(validatePassword(''));
  assert.ok(validatePassword('12345'));
  assert.equal(validatePassword('123456'), undefined);
});

test('validateDisplayName checks bounds matching Firestore rules', () => {
  assert.ok(validateDisplayName(' '));
  assert.ok(validateDisplayName('A'));
  assert.ok(validateDisplayName('A'.repeat(81)));
  assert.equal(validateDisplayName('Budi Santoso'), undefined);
});

test('validateLoginForm and validateRegisterForm catch mismatched passwords', () => {
  const loginErrs = validateLoginForm('bad', '123');
  assert.ok(loginErrs.email);
  assert.ok(loginErrs.password);

  const regErrs = validateRegisterForm('Ani', 'ani@kampus.ac.id', 'secret1', 'secret2');
  assert.equal(regErrs.displayName, undefined);
  assert.equal(regErrs.email, undefined);
  assert.equal(regErrs.password, undefined);
  assert.ok(regErrs.confirmPassword);
});

test('canAccessRole enforces RBAC for student vs teacher routes', () => {
  assert.equal(canAccessRole(null, ['student']), false);
  assert.equal(canAccessRole('student', undefined), true);
  assert.equal(canAccessRole('student', ['student', 'teacher']), true);
  assert.equal(canAccessRole('student', ['teacher']), false);
  assert.equal(canAccessRole('teacher', ['teacher']), true);
});

test('getDefaultRouteForRole routes teacher and student properly', () => {
  assert.equal(getDefaultRouteForRole('student'), '/dashboard');
  assert.equal(getDefaultRouteForRole('teacher'), '/teacher/dashboard');
});

test('mapFirebaseAuthError translates known Firebase error codes', () => {
  assert.match(mapFirebaseAuthError('auth/invalid-credential'), /Email atau kata sandi/);
  assert.match(mapFirebaseAuthError('auth/operation-not-allowed'), /Firebase Console/);
  assert.match(mapFirebaseAuthError('auth/configuration-not-found'), /Firebase Console/);
  assert.match(mapFirebaseAuthError('auth/unauthorized-domain'), /Authorized Domains/);
  assert.match(mapFirebaseAuthError('auth/popup-blocked'), /Popup login Google/);
  assert.match(mapFirebaseAuthError('auth/some-custom-code'), /auth\/some-custom-code/);
});
