import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, GraduationCap, Plus, Users } from 'lucide-react';
import { QuizAuthoringPanel } from '../components/QuizAuthoringPanel';
import { useAuth } from '../hooks/useAuth';
import {
  createClassroom,
  getClassErrorMessage,
  listClassroomStudents,
  listTeacherClasses,
} from '../services/classService';
import type { Classroom, ClassroomStudent } from '../types';

/**
 * Role-protected instructor dashboard for creating classes and viewing each class roster.
 */
export function TeacherDashboardPage() {
  const { userProfile } = useAuth();
  const teacherId = userProfile?.role === 'teacher' ? userProfile.uid : null;
  const [className, setClassName] = useState('');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomsLoading, setClassroomsLoading] = useState(true);
  const [creatingClass, setCreatingClass] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedClassCode, setSelectedClassCode] = useState<string | null>(null);
  const [roster, setRoster] = useState<ClassroomStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!teacherId) {
      setClassroomsLoading(false);
      return () => {
        active = false;
      };
    }

    setClassroomsLoading(true);
    setClassError(null);
    void listTeacherClasses(teacherId)
      .then((items) => {
        if (active) setClassrooms(items);
      })
      .catch((error: unknown) => {
        if (active) setClassError(getClassErrorMessage(error));
      })
      .finally(() => {
        if (active) setClassroomsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [teacherId]);

  if (!userProfile || userProfile.role !== 'teacher') return null;

  const handleCreateClass = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setClassError(null);
    setNotice(null);
    setCreatingClass(true);
    try {
      const classroom = await createClassroom(userProfile, className);
      setClassrooms((current) => [classroom, ...current]);
      setClassName('');
      setSelectedClassCode(classroom.code);
      setRoster([]);
      setNotice(`Kelas berhasil dibuat. Bagikan kode ${classroom.code} kepada mahasiswa.`);
    } catch (error: unknown) {
      setClassError(getClassErrorMessage(error));
    } finally {
      setCreatingClass(false);
    }
  };

  const handleToggleRoster = async (classroom: Classroom): Promise<void> => {
    setClassError(null);
    if (selectedClassCode === classroom.code) {
      setSelectedClassCode(null);
      return;
    }

    setSelectedClassCode(classroom.code);
    setRoster([]);
    setRosterLoading(true);
    try {
      const students = await listClassroomStudents(classroom.code);
      setRoster(students);
    } catch (error: unknown) {
      setClassError(getClassErrorMessage(error));
    } finally {
      setRosterLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold text-sky-700">
          Panel Dosen · Peran: {userProfile.role}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard Dosen — {userProfile.displayName}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Buat dan terbitkan kuis untuk mahasiswa. Kelas tetap tersedia sebagai fitur tambahan.
        </p>
      </div>

      <section className="mt-8">
        <QuizAuthoringPanel />
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-sky-600" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900">Buat Kelas</h2>
        </div>
        <form onSubmit={handleCreateClass} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="class-name">
            Nama kelas
          </label>
          <input
            id="class-name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={className}
            onChange={(event) => setClassName(event.target.value)}
            placeholder="Contoh: Matematika Dasar A"
            className="min-h-[44px] flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
          />
          <button
            type="submit"
            disabled={creatingClass}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {creatingClass ? 'Membuat...' : 'Buat Kelas'}
          </button>
        </form>

        {classError && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {classError}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {notice}
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-sky-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900">Kelas dan Mahasiswa</h2>
        </div>

        {classroomsLoading ? (
          <p className="mt-4 text-sm text-slate-600">Memuat daftar kelas...</p>
        ) : classrooms.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-800">Belum ada kelas</p>
            <p className="mt-1 text-sm text-slate-600">Buat kelas untuk mendapatkan kode bergabung.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {classrooms.map((classroom) => {
              const isSelected = selectedClassCode === classroom.code;
              return (
                <article
                  key={classroom.code}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-bold text-slate-900">{classroom.name}</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Kode kelas:{' '}
                        <code className="rounded bg-slate-100 px-2 py-1 font-mono font-bold tracking-widest text-sky-800">
                          {classroom.code}
                        </code>
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-expanded={isSelected}
                      onClick={() => void handleToggleRoster(classroom)}
                      className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {isSelected ? 'Tutup daftar' : 'Lihat mahasiswa'}
                    </button>
                  </div>

                  {isSelected && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <h4 className="text-sm font-semibold text-slate-800">Mahasiswa terdaftar</h4>
                      {rosterLoading ? (
                        <p className="mt-3 text-sm text-slate-600">Memuat daftar mahasiswa...</p>
                      ) : roster.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-600">
                          Belum ada mahasiswa yang bergabung. Bagikan kode kelas di atas.
                        </p>
                      ) : (
                        <ul className="mt-3 divide-y divide-slate-100">
                          {roster.map((student) => (
                            <li
                              key={student.uid}
                              className="flex items-center justify-between gap-4 py-3 text-sm"
                            >
                              <span className="font-medium text-slate-900">
                                {student.displayName}
                              </span>
                              <span className="text-xs text-slate-500">
                                Bergabung {new Date(student.joinedAt).toLocaleDateString('id-ID')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
