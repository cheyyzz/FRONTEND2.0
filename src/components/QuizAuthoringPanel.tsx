import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, FilePlus2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createTeacherQuiz, getQuizErrorMessage, listTeacherQuizzes } from '../services/quizService';
import type { Quiz, QuizQuestionDraft } from '../types';

const MAX_QUESTIONS = 20;

function createEmptyQuestion(): QuizQuestionDraft {
  return {
    stem: '',
    options: ['', '', '', ''],
    correctIndex: null,
    explanation: '',
  };
}

function parseAnswerIndex(value: string): 0 | 1 | 2 | 3 | null {
  switch (value) {
    case '0':
      return 0;
    case '1':
      return 1;
    case '2':
      return 2;
    case '3':
      return 3;
    default:
      return null;
  }
}

export function QuizAuthoringPanel() {
  const { userProfile } = useAuth();
  const teacherId = userProfile?.role === 'teacher' ? userProfile.uid : null;
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([createEmptyQuestion()]);

  useEffect(() => {
    let active = true;
    if (!teacherId) {
      setQuizzesLoading(false);
      return () => {
        active = false;
      };
    }

    setQuizzesLoading(true);
    setError(null);
    void listTeacherQuizzes(teacherId)
      .then((items) => {
        if (active) setQuizzes(items);
      })
      .catch((loadError: unknown) => {
        if (active) setError(getQuizErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setQuizzesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [teacherId]);

  const updateQuestion = (index: number, patch: Partial<QuizQuestionDraft>): void => {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question
      )
    );
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string): void => {
    setQuestions((current) =>
      current.map((question, index) => {
        if (index !== questionIndex) return question;
        const options: QuizQuestionDraft['options'] = [...question.options];
        options[optionIndex] = value;
        return { ...question, options };
      })
    );
  };

  const handleCreateQuiz = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!userProfile || userProfile.role !== 'teacher') return;

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const quiz = await createTeacherQuiz(userProfile, {
        title,
        description,
        subject,
        topic,
        questions,
      });
      setQuizzes((current) => [quiz, ...current]);
      setTitle('');
      setDescription('');
      setSubject('');
      setTopic('');
      setQuestions([createEmptyQuestion()]);
      setNotice(`Kuis “${quiz.title}” berhasil diterbitkan dan dapat dikerjakan mahasiswa.`);
    } catch (createError: unknown) {
      setError(getQuizErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <FilePlus2 className="h-5 w-5 text-sky-600" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900">Buat Kuis untuk Mahasiswa</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Masukkan soal pilihan ganda dan kunci jawaban. Kuis langsung diterbitkan untuk semua mahasiswa.
        </p>

        <form onSubmit={handleCreateQuiz} className="mt-5 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="quiz-title" className="block text-sm font-medium text-slate-700">
                Judul kuis
              </label>
              <input
                id="quiz-title"
                required
                minLength={2}
                maxLength={100}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Contoh: Kuis Aljabar Linear"
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
            </div>
            <div>
              <label htmlFor="quiz-subject" className="block text-sm font-medium text-slate-700">
                Mata kuliah
              </label>
              <input
                id="quiz-subject"
                required
                minLength={2}
                maxLength={80}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Contoh: Matematika"
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
            </div>
            <div>
              <label htmlFor="quiz-topic" className="block text-sm font-medium text-slate-700">
                Topik
              </label>
              <input
                id="quiz-topic"
                required
                minLength={2}
                maxLength={100}
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Contoh: Matriks"
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
            </div>
            <div>
              <label htmlFor="quiz-description" className="block text-sm font-medium text-slate-700">
                Petunjuk (opsional)
              </label>
              <input
                id="quiz-description"
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Petunjuk singkat untuk mahasiswa"
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((question, questionIndex) => (
              <fieldset
                key={questionIndex}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
              >
                <legend className="px-1 text-sm font-bold text-slate-900">
                  Soal {questionIndex + 1}
                </legend>
                <label
                  htmlFor={`question-stem-${questionIndex}`}
                  className="block text-sm font-medium text-slate-700"
                >
                  Pertanyaan
                </label>
                <textarea
                  id={`question-stem-${questionIndex}`}
                  required
                  minLength={5}
                  maxLength={1000}
                  rows={3}
                  value={question.stem}
                  onChange={(event) => updateQuestion(questionIndex, { stem: event.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex}>
                      <label
                        htmlFor={`question-${questionIndex}-option-${optionIndex}`}
                        className="block text-xs font-medium text-slate-600"
                      >
                        Opsi {String.fromCharCode(65 + optionIndex)}
                      </label>
                      <input
                        id={`question-${questionIndex}-option-${optionIndex}`}
                        required
                        maxLength={200}
                        value={option}
                        onChange={(event) =>
                          handleOptionChange(questionIndex, optionIndex, event.target.value)
                        }
                        className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`question-${questionIndex}-answer`}
                      className="block text-sm font-medium text-slate-700"
                    >
                      Jawaban benar
                    </label>
                    <select
                      id={`question-${questionIndex}-answer`}
                      required
                      value={question.correctIndex ?? ''}
                      onChange={(event) => {
                        const correctIndex = parseAnswerIndex(event.target.value);
                        if (correctIndex !== null) {
                          updateQuestion(questionIndex, { correctIndex });
                        }
                      }}
                      className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                    >
                      <option value="" disabled>
                        Pilih jawaban benar
                      </option>
                      {question.options.map((_, optionIndex) => (
                        <option key={optionIndex} value={optionIndex}>
                          Opsi {String.fromCharCode(65 + optionIndex)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor={`question-${questionIndex}-explanation`}
                      className="block text-sm font-medium text-slate-700"
                    >
                      Pembahasan (opsional)
                    </label>
                    <input
                      id={`question-${questionIndex}-explanation`}
                      maxLength={1000}
                      value={question.explanation}
                      onChange={(event) =>
                        updateQuestion(questionIndex, { explanation: event.target.value })
                      }
                      className="mt-1.5 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                    />
                  </div>
                </div>

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions((current) =>
                        current.filter((_, index) => index !== questionIndex)
                      )
                    }
                    className="mt-4 inline-flex min-h-[36px] items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Hapus soal
                  </button>
                )}
              </fieldset>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={questions.length >= MAX_QUESTIONS}
              onClick={() => setQuestions((current) => [...current, createEmptyQuestion()])}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah soal ({questions.length}/{MAX_QUESTIONS})
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? 'Menerbitkan...' : 'Terbitkan Kuis'}
            </button>
          </div>
        </form>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {notice}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900">Kuis yang Diterbitkan</h2>
        {quizzesLoading ? (
          <p className="mt-3 text-sm text-slate-600">Memuat daftar kuis...</p>
        ) : quizzes.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            Belum ada kuis yang diterbitkan.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="font-bold text-slate-900">{quiz.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {quiz.subject} · {quiz.topic}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  {quiz.questionCount} soal · Diterbitkan
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
