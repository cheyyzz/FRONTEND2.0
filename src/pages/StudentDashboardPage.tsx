import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, GraduationCap, ShieldAlert, UserCheck } from 'lucide-react';
import { StudentQuizList } from '../components/StudentQuizList';
import { useAuth } from '../hooks/useAuth';
import {
  getClassErrorMessage,
  joinClassroomWithCode,
  listStudentClasses,
} from '../services/classService';
import type { StudentClass } from '../types';
import { validateDisplayName } from '../utils/authValidation';

/**
 * Protected student workspace showing classes, authenticated profile, SRL status, and name update CRUD.
 */
export function StudentDashboardPage() {
  const { userProfile, emailVerified, updateDisplayName, actionLoading, authError } = useAuth();
  const [nameInput, setNameInput] = useState<string>(userProfile?.displayName ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [joiningClass, setJoiningClass] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);
  const [classNotice, setClassNotice] = useState<string | null>(null);

  const studentId = userProfile?.role === 'student' ? userProfile.uid : null;

  useEffect(() => {
    let active = true;
    if (!studentId) {
      setClassesLoading(false);
      return () => {
        active = false;
      };
    }

    setClassesLoading(true);
    setClassError(null);
    void listStudentClasses(studentId)
      .then((items) => {
        if (active) setStudentClasses(items);
      })
      .catch((error: unknown) => {
        if (active) setClassError(getClassErrorMessage(error));
      })
      .finally(() => {
        if (active) setClassesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [studentId]);

  if (!userProfile) return null;

  const topicEntries = Object.entries(userProfile.masteryByTopic);

  const handleUpdateName = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSavedNotice(null);
    const validationErr = validateDisplayName(nameInput);
    if (validationErr) {
      setNameError(validationErr);
      return;
    }
    setNameError(null);

    const updated = await updateDisplayName(nameInput);
    if (updated) {
      setSavedNotice('Nama profil berhasil diperbarui di Cloud Firestore.');
    }
  };

  const handleJoinClass = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setClassError(null);
    setClassNotice(null);
    setJoiningClass(true);
    try {
      const joinedClass = await joinClassroomWithCode(userProfile, classCodeInput);
      setStudentClasses((current) => [joinedClass, ...current]);
      setClassCodeInput('');
      setClassNotice(`Berhasil bergabung dengan kelas ${joinedClass.name}.`);
    } catch (error: unknown) {
      setClassError(getClassErrorMessage(error));
    } finally {
      setJoiningClass(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold text-sky-700">
          Workspace Mahasiswa · Peran: {userProfile.role}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Selamat datang, {userProfile.displayName}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {userProfile.email} · {emailVerified ? 'Email terverifikasi' : 'Email belum terverifikasi'}
        </p>
      </div>

      {!emailVerified && (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <p>
            Akun Anda aktif dengan sesi Email/Password. Verifikasi email dianjurkan untuk keamanan
            penuh akun Anda.
          </p>
        </div>
      )}

      {userProfile.role === 'student' && <StudentQuizList />}

      {userProfile.role === 'student' && (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-sky-600" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">Kelas Saya</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Masukkan kode dari dosen untuk bergabung. Dosen hanya dapat melihat daftar mahasiswa di kelasnya.
          </p>

          <form onSubmit={handleJoinClass} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="class-code">
              Kode kelas
            </label>
            <input
              id="class-code"
              type="text"
              required
              minLength={8}
              maxLength={8}
              value={classCodeInput}
              onChange={(event) =>
                setClassCodeInput(event.target.value.toUpperCase().replace(/\s/g, ''))
              }
              placeholder="Contoh: ABCD2345"
              autoComplete="off"
              className="min-h-[44px] flex-1 rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-sm uppercase tracking-widest text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            />
            <button
              type="submit"
              disabled={joiningClass}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
            >
              {joiningClass ? 'Bergabung...' : 'Gabung Kelas'}
            </button>
          </form>

          {classError && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {classError}
            </p>
          )}
          {classNotice && (
            <p
              role="status"
              className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {classNotice}
            </p>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-800">Kelas yang diikuti</h3>
            {classesLoading ? (
              <p className="mt-3 text-sm text-slate-600">Memuat kelas...</p>
            ) : studentClasses.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">Anda belum bergabung dengan kelas mana pun.</p>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {studentClasses.map((classroom) => (
                  <li
                    key={classroom.code}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">{classroom.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Dosen: {classroom.teacherName}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Kode kelas: <code className="font-mono">{classroom.code}</code>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* Profile settings form */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-sky-600" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">Profil Akun &amp; Sinkronisasi</h2>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Perubahan nama langsung disimpan ke dokumen Firestore <code className="font-mono">users/{userProfile.uid}</code>.
          </p>

          <form onSubmit={handleUpdateName} className="mt-5 space-y-4">
            <div>
              <label htmlFor="profile-display-name" className="block text-xs font-semibold text-slate-700">
                Nama Tampilan
              </label>
              <input
                id="profile-display-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="mt-1.5 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
              {nameError && <p className="mt-1 text-xs font-medium text-red-600">{nameError}</p>}
              {authError && <p className="mt-1 text-xs font-medium text-red-600">{authError}</p>}
            </div>

            {savedNotice && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>{savedNotice}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
            >
              {actionLoading ? 'Menyimpan...' : 'Simpan Nama Profil'}
            </button>
          </form>
        </section>

        {/* Mastery overview */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <h2 className="text-base font-bold text-slate-900">Analisis Penguasaan Topik</h2>
          <p className="mt-1 text-xs text-slate-600">
            Skor dan pembahasan tiap kuis tampil setelah pengerjaan. Ringkasan performa lintas kuis belum tersedia.
          </p>

          {topicEntries.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-800">Analisis topik belum tersedia</p>
              <p className="mt-1 text-xs text-slate-600">
                Untuk saat ini, buka kuis yang sudah dikerjakan untuk melihat skor dan pembahasannya.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 font-semibold">Topik</th>
                    <th className="py-2 text-right font-semibold">Benar / Total</th>
                    <th className="py-2 text-right font-semibold">Level Adaptif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topicEntries.map(([topic, mastery]) => (
                    <tr key={topic}>
                      <td className="py-2.5 font-medium text-slate-900">{topic}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-700">
                        {mastery.totalCorrect}/{mastery.totalAnswered}
                      </td>
                      <td className="py-2.5 text-right capitalize text-sky-700">
                        {mastery.currentDifficulty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
