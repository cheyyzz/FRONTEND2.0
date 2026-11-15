import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getQuizErrorMessage, listPublishedQuizzes } from '../services/quizService';
import type { Quiz } from '../types';

export function StudentQuizList() {
  const { userProfile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (userProfile?.role !== 'student') {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    void listPublishedQuizzes()
      .then((items) => {
        if (active) setQuizzes(items);
      })
      .catch((loadError: unknown) => {
        if (active) setError(getQuizErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userProfile?.role]);

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2">
        <BookOpenCheck className="h-5 w-5 text-sky-600" aria-hidden="true" />
        <h2 className="text-lg font-bold text-slate-900">Kuis dari Dosen</h2>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Pilih kuis yang sudah diterbitkan dosen untuk mulai mengerjakannya.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p className="mt-4 text-sm text-slate-600">Memuat kuis...</p>
      ) : quizzes.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          Belum ada kuis yang diterbitkan.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {quizzes.map((quiz) => (
            <li key={quiz.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">{quiz.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {quiz.subject} · {quiz.topic}
              </p>
              {quiz.description && <p className="mt-2 text-sm text-slate-600">{quiz.description}</p>}
              <p className="mt-3 text-xs text-slate-500">{quiz.questionCount} soal</p>
              <Link
                to={`/quizzes/${quiz.id}`}
                className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Buka Kuis
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
