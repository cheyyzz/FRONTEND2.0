import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  getPublishedQuiz,
  getQuizAnswerKeys,
  getQuizAttempt,
  getQuizErrorMessage,
  listQuizQuestions,
  submitQuizAttempt,
} from '../services/quizService';
import type {
  PublicQuizQuestion,
  Quiz,
  QuizAnswerKey,
  QuizAttempt,
} from '../types';

const ANSWER_INDICES = [0, 1, 2, 3] as const;

export function QuizTakePage() {
  const { quizId = '' } = useParams();
  const { userProfile } = useAuth();
  const studentId = userProfile?.role === 'student' ? userProfile.uid : null;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<PublicQuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 0 | 1 | 2 | 3>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [answerKeys, setAnswerKeys] = useState<Record<string, QuizAnswerKey> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!quizId || !studentId) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    void (async () => {
      const [loadedQuiz, loadedQuestions, existingAttempt] = await Promise.all([
        getPublishedQuiz(quizId),
        listQuizQuestions(quizId),
        getQuizAttempt(quizId, studentId),
      ]);
      if (!loadedQuiz) {
        throw new Error('Kuis tidak ditemukan atau belum diterbitkan.');
      }
      if (loadedQuestions.length !== loadedQuiz.questionCount) {
        throw new Error('Jumlah soal kuis tidak sesuai. Hubungi dosen yang membuat kuis.');
      }

      const loadedKeys = existingAttempt ? await getQuizAnswerKeys(quizId) : null;
      if (
        existingAttempt &&
        (Object.keys(loadedKeys ?? {}).length !== loadedQuestions.length ||
          loadedQuestions.some((question) => !loadedKeys?.[question.id]))
      ) {
        throw new Error('Kunci jawaban kuis tidak lengkap. Hubungi dosen yang membuat kuis.');
      }
      if (!active) return;
      setQuiz(loadedQuiz);
      setQuestions(loadedQuestions);
      setAttempt(existingAttempt);
      setSelectedAnswers(existingAttempt?.selectedAnswers ?? {});
      setAnswerKeys(loadedKeys);
    })()
      .catch((loadError: unknown) => {
        if (active) setError(getQuizErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [quizId, studentId]);

  const handleAnswerChange = (questionId: string, answerIndex: 0 | 1 | 2 | 3): void => {
    setSelectedAnswers((current) => ({ ...current, [questionId]: answerIndex }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!quiz || !studentId) return;
    if (questions.some((question) => selectedAnswers[question.id] === undefined)) {
      setError('Jawab semua soal sebelum mengirim kuis.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const submittedAttempt = await submitQuizAttempt(
        quiz.id,
        studentId,
        selectedAnswers,
        questions.length
      );
      setAttempt(submittedAttempt);
      const submittedKeys = await getQuizAnswerKeys(quiz.id);
      if (
        Object.keys(submittedKeys).length !== questions.length ||
        questions.some((question) => !submittedKeys[question.id])
      ) {
        throw new Error('Kunci jawaban kuis tidak lengkap. Hubungi dosen yang membuat kuis.');
      }
      setAnswerKeys(submittedKeys);
    } catch (submitError: unknown) {
      setError(getQuizErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p role="status" className="text-sm text-slate-600">Memuat kuis...</p>
      </main>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link to="/dashboard" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
          <ArrowLeft className="mr-1 inline h-4 w-4" aria-hidden="true" />
          Kembali ke dashboard
        </Link>
        <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Kuis tidak tersedia.'}
        </p>
      </main>
    );
  }

  const score =
    attempt && answerKeys
      ? questions.reduce(
          (total, question) =>
            total + Number(attempt.selectedAnswers[question.id] === answerKeys[question.id]?.correctIndex),
          0
        )
      : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/dashboard" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
        <ArrowLeft className="mr-1 inline h-4 w-4" aria-hidden="true" />
        Kembali ke dashboard
      </Link>

      <header className="mt-5 border-b border-slate-200 pb-5">
        <p className="text-xs font-semibold text-sky-700">{quiz.subject} · {quiz.topic}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{quiz.title}</h1>
        {quiz.description && <p className="mt-2 text-sm text-slate-600">{quiz.description}</p>}
        <p className="mt-2 text-xs text-slate-500">{questions.length} soal pilihan ganda</p>
      </header>

      {attempt ? (
        answerKeys && score !== null ? (
          <section className="mt-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                <h2 className="text-lg font-bold">Kuis selesai</h2>
              </div>
              <p className="mt-2 text-sm text-emerald-900">
                Skor Anda: <strong>{score}/{questions.length}</strong> (
                {Math.round((score / questions.length) * 100)}%)
              </p>
            </div>

            <h2 className="mt-7 text-lg font-bold text-slate-900">Pembahasan</h2>
            <ol className="mt-3 space-y-4">
              {questions.map((question, questionIndex) => {
                const answerKey = answerKeys[question.id];
                const selectedIndex = attempt.selectedAnswers[question.id];
                const isCorrect = selectedIndex === answerKey?.correctIndex;
                return (
                  <li key={question.id} className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="font-semibold text-slate-900">
                      {questionIndex + 1}. {question.stem}
                    </p>
                    <p className={`mt-3 text-sm font-medium ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                      Jawaban Anda:{' '}
                      {selectedIndex === undefined
                        ? 'Tidak dijawab'
                        : question.options[selectedIndex]}
                      {isCorrect ? ' (benar)' : ' (belum tepat)'}
                    </p>
                    {answerKey && (
                      <>
                        {!isCorrect && (
                          <p className="mt-1 text-sm text-slate-700">
                            Jawaban benar: {question.options[answerKey.correctIndex]}
                          </p>
                        )}
                        {answerKey.explanation && (
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            {answerKey.explanation}
                          </p>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : (
          <p role="alert" className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Jawaban sudah terkirim, tetapi pembahasan belum dapat dimuat: {error ?? 'silakan muat ulang halaman.'}
          </p>
        )
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {questions.map((question, questionIndex) => (
            <fieldset key={question.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <legend className="px-1 text-sm font-bold text-slate-900">
                Soal {questionIndex + 1}
              </legend>
              <p className="text-sm leading-relaxed text-slate-800">{question.stem}</p>
              <div className="mt-4 space-y-2">
                {ANSWER_INDICES.map((answerIndex) => (
                  <label
                    key={answerIndex}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name={`answer-${question.id}`}
                      value={answerIndex}
                      checked={selectedAnswers[question.id] === answerIndex}
                      onChange={() => handleAnswerChange(question.id, answerIndex)}
                      className="mt-0.5 accent-sky-600"
                    />
                    <span>
                      <strong className="mr-1">{String.fromCharCode(65 + answerIndex)}.</strong>
                      {question.options[answerIndex]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
          </button>
        </form>
      )}
    </main>
  );
}
