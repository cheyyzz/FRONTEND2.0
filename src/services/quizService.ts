import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import type {
  DifficultyLevel,
  PublicQuizQuestion,
  Quiz,
  QuizAnswerKey,
  QuizAttempt,
  QuizDifficultyMode,
  QuizQuestionDraft,
  User,
} from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';

const MAX_QUESTIONS_PER_QUIZ = 20;

class QuizServiceError extends Error {}

function isDifficulty(value: unknown): value is DifficultyLevel {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

function isQuizDifficulty(value: unknown): value is QuizDifficultyMode {
  return value === 'adaptive' || isDifficulty(value);
}

function readTimestamp(value: unknown, fieldName: string): string {
  if (!(value instanceof Timestamp)) {
    throw new Error(`Data kuis tidak valid: ${fieldName} bukan timestamp.`);
  }
  return value.toDate().toISOString();
}

function readQuiz(id: string, data: DocumentData): Quiz {
  if (
    typeof data.title !== 'string' ||
    typeof data.subject !== 'string' ||
    typeof data.topic !== 'string' ||
    typeof data.subtopic !== 'string' ||
    !isQuizDifficulty(data.difficulty) ||
    data.sourceType !== 'manual' ||
    typeof data.createdBy !== 'string' ||
    data.creatorRole !== 'teacher' ||
    typeof data.isPublished !== 'boolean' ||
    typeof data.questionCount !== 'number' ||
    typeof data.verifiedCount !== 'number'
  ) {
    throw new Error('Data kuis tidak lengkap atau tidak valid.');
  }

  return {
    id,
    title: data.title,
    description: typeof data.description === 'string' ? data.description : undefined,
    subject: data.subject,
    topic: data.topic,
    subtopic: data.subtopic,
    difficulty: data.difficulty,
    sourceType: data.sourceType,
    createdBy: data.createdBy,
    creatorRole: data.creatorRole,
    isPublished: data.isPublished,
    questionCount: data.questionCount,
    verifiedCount: data.verifiedCount,
    createdAt: readTimestamp(data.createdAt, 'createdAt'),
    updatedAt: readTimestamp(data.updatedAt, 'updatedAt'),
  };
}

function isOptionTuple(value: unknown): value is [string, string, string, string] {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((option) => typeof option === 'string')
  );
}

function readPublicQuestion(id: string, data: DocumentData): PublicQuizQuestion {
  if (
    typeof data.stem !== 'string' ||
    !isOptionTuple(data.options) ||
    typeof data.order !== 'number' ||
    !Number.isInteger(data.order)
  ) {
    throw new Error('Data soal kuis tidak lengkap atau tidak valid.');
  }
  return { id, stem: data.stem, options: data.options, order: data.order };
}

function isAnswerIndex(value: unknown): value is 0 | 1 | 2 | 3 {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 3;
}

function readAnswerKey(data: DocumentData): QuizAnswerKey {
  if (!isAnswerIndex(data.correctIndex) || typeof data.explanation !== 'string') {
    throw new Error('Kunci jawaban kuis tidak lengkap atau tidak valid.');
  }
  return { correctIndex: data.correctIndex, explanation: data.explanation };
}

function readAttempt(quizId: string, studentId: string, data: DocumentData): QuizAttempt {
  if (
    data.quizId !== quizId ||
    data.studentId !== studentId ||
    typeof data.questionCount !== 'number' ||
    typeof data.selectedAnswers !== 'object' ||
    data.selectedAnswers === null ||
    Array.isArray(data.selectedAnswers)
  ) {
    throw new Error('Data pengerjaan kuis tidak lengkap atau tidak valid.');
  }

  const selectedAnswers: Record<string, 0 | 1 | 2 | 3> = {};
  for (const [questionId, answerIndex] of Object.entries(data.selectedAnswers)) {
    if (!isAnswerIndex(answerIndex)) {
      throw new Error('Pilihan jawaban pada pengerjaan kuis tidak valid.');
    }
    selectedAnswers[questionId] = answerIndex;
  }

  return {
    quizId,
    studentId,
    selectedAnswers,
    questionCount: data.questionCount,
    submittedAt: readTimestamp(data.submittedAt, 'submittedAt'),
  };
}

function handleQuizServiceError(error: unknown, operation: OperationType, path: string): never {
  if (error instanceof QuizServiceError) {
    throw error;
  }
  handleFirestoreError(error, operation, path);
}

export function getQuizErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Terjadi kesalahan saat memproses kuis.';
  }

  try {
    const details: unknown = JSON.parse(error.message);
    if (
      typeof details === 'object' &&
      details !== null &&
      'error' in details &&
      typeof details.error === 'string'
    ) {
      if (details.error.includes('Missing or insufficient permissions')) {
        return 'Akses kuis ditolak. Pastikan firestore.rules terbaru sudah diterapkan dan peran akun sudah sesuai.';
      }
      return details.error;
    }
  } catch {
    return error.message;
  }

  return error.message;
}

function validateQuizDraft(
  title: string,
  subject: string,
  topic: string,
  questions: QuizQuestionDraft[]
): void {
  if (title.trim().length < 2 || title.trim().length > 100) {
    throw new QuizServiceError('Judul kuis harus terdiri dari 2 sampai 100 karakter.');
  }
  if (subject.trim().length < 2 || subject.trim().length > 80) {
    throw new QuizServiceError('Mata kuliah harus terdiri dari 2 sampai 80 karakter.');
  }
  if (topic.trim().length < 2 || topic.trim().length > 100) {
    throw new QuizServiceError('Topik harus terdiri dari 2 sampai 100 karakter.');
  }
  if (questions.length < 1 || questions.length > MAX_QUESTIONS_PER_QUIZ) {
    throw new QuizServiceError(`Kuis harus memiliki 1 sampai ${MAX_QUESTIONS_PER_QUIZ} soal.`);
  }

  for (const [index, question] of questions.entries()) {
    if (question.stem.trim().length < 5 || question.stem.trim().length > 1000) {
      throw new QuizServiceError(`Soal ${index + 1} harus berisi 5 sampai 1000 karakter.`);
    }
    if (
      question.options.some((option) => option.trim().length < 1 || option.trim().length > 200)
    ) {
      throw new QuizServiceError(`Semua opsi pada soal ${index + 1} wajib diisi (maksimal 200 karakter).`);
    }
    if (question.correctIndex === null || !isAnswerIndex(question.correctIndex)) {
      throw new QuizServiceError(`Pilih jawaban benar untuk soal ${index + 1}.`);
    }
    if (question.explanation.trim().length > 1000) {
      throw new QuizServiceError(`Pembahasan soal ${index + 1} maksimal 1000 karakter.`);
    }
  }
}

export async function createTeacherQuiz(
  teacher: Pick<User, 'uid' | 'displayName'>,
  input: {
    title: string;
    description: string;
    subject: string;
    topic: string;
    questions: QuizQuestionDraft[];
  }
): Promise<Quiz> {
  validateQuizDraft(input.title, input.subject, input.topic, input.questions);

  const title = input.title.trim();
  const description = input.description.trim();
  if (description.length > 500) {
    throw new QuizServiceError('Deskripsi kuis maksimal 500 karakter.');
  }
  const questions = input.questions.map((question, index) => {
    if (question.correctIndex === null || !isAnswerIndex(question.correctIndex)) {
      throw new QuizServiceError(`Pilih jawaban benar untuk soal ${index + 1}.`);
    }
    return { ...question, correctIndex: question.correctIndex };
  });

  const quizRef = doc(collection(db, 'quizzes'));
  const batch = writeBatch(db);
  const now = serverTimestamp();

  batch.set(quizRef, {
    title,
    description,
    subject: input.subject.trim(),
    topic: input.topic.trim(),
    subtopic: input.topic.trim(),
    difficulty: 'medium',
    sourceType: 'manual',
    createdBy: teacher.uid,
    creatorRole: 'teacher',
    isPublished: true,
    questionCount: questions.length,
    verifiedCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  questions.forEach((question, index) => {
    const questionRef = doc(collection(db, 'quizzes', quizRef.id, 'questions'));
    batch.set(questionRef, {
      quizId: quizRef.id,
      stem: question.stem.trim(),
      options: question.options.map((option) => option.trim()),
      order: index,
    });
    batch.set(doc(db, 'quizzes', quizRef.id, 'answerKeys', questionRef.id), {
      quizId: quizRef.id,
      correctIndex: question.correctIndex,
      explanation: question.explanation.trim(),
    });
  });

  try {
    await batch.commit();
  } catch (error: unknown) {
    handleQuizServiceError(error, OperationType.CREATE, `quizzes/${quizRef.id}`);
  }

  const nowIso = new Date().toISOString();
  return {
    id: quizRef.id,
    title,
    description,
    subject: input.subject.trim(),
    topic: input.topic.trim(),
    subtopic: input.topic.trim(),
    difficulty: 'medium',
    sourceType: 'manual',
    createdBy: teacher.uid,
    creatorRole: 'teacher',
    isPublished: true,
    questionCount: questions.length,
    verifiedCount: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export async function listTeacherQuizzes(teacherId: string): Promise<Quiz[]> {
  try {
    const quizQuery = query(collection(db, 'quizzes'), where('createdBy', '==', teacherId));
    const snapshots = await getDocs(quizQuery);
    return snapshots.docs
      .map((snapshot) => readQuiz(snapshot.id, snapshot.data()))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  } catch (error: unknown) {
    handleFirestoreError(error, OperationType.LIST, 'quizzes');
  }
}

export async function listPublishedQuizzes(): Promise<Quiz[]> {
  try {
    const quizQuery = query(collection(db, 'quizzes'), where('isPublished', '==', true));
    const snapshots = await getDocs(quizQuery);
    return snapshots.docs
      .map((snapshot) => readQuiz(snapshot.id, snapshot.data()))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  } catch (error: unknown) {
    handleFirestoreError(error, OperationType.LIST, 'quizzes');
  }
}

export async function getPublishedQuiz(quizId: string): Promise<Quiz | null> {
  try {
    const snapshot = await getDoc(doc(db, 'quizzes', quizId));
    if (!snapshot.exists()) return null;
    const quiz = readQuiz(snapshot.id, snapshot.data());
    return quiz.isPublished ? quiz : null;
  } catch (error: unknown) {
    handleFirestoreError(error, OperationType.GET, `quizzes/${quizId}`);
  }
}

export async function listQuizQuestions(quizId: string): Promise<PublicQuizQuestion[]> {
  try {
    const questionQuery = query(
      collection(db, 'quizzes', quizId, 'questions'),
      orderBy('order', 'asc')
    );
    const snapshots = await getDocs(questionQuery);
    return snapshots.docs.map((snapshot) => readPublicQuestion(snapshot.id, snapshot.data()));
  } catch (error: unknown) {
    handleFirestoreError(error, OperationType.LIST, `quizzes/${quizId}/questions`);
  }
}

export async function getQuizAttempt(
  quizId: string,
  studentId: string
): Promise<QuizAttempt | null> {
  try {
    const snapshot = await getDoc(doc(db, 'quizzes', quizId, 'attempts', studentId));
    return snapshot.exists() ? readAttempt(quizId, studentId, snapshot.data()) : null;
  } catch (error: unknown) {
    handleFirestoreError(error, OperationType.GET, `quizzes/${quizId}/attempts/${studentId}`);
  }
}

export async function submitQuizAttempt(
  quizId: string,
  studentId: string,
  selectedAnswers: Record<string, 0 | 1 | 2 | 3>,
  questionCount: number
): Promise<QuizAttempt> {
  if (
    questionCount < 1 ||
    Object.keys(selectedAnswers).length !== questionCount ||
    Object.values(selectedAnswers).some((answer) => !isAnswerIndex(answer))
  ) {
    throw new QuizServiceError('Jawab semua soal sebelum mengirim kuis.');
  }

  const quizRef = doc(db, 'quizzes', quizId);
  const attemptRef = doc(db, 'quizzes', quizId, 'attempts', studentId);
  try {
    return await runTransaction(db, async (transaction) => {
      const [quizSnapshot, attemptSnapshot] = await Promise.all([
        transaction.get(quizRef),
        transaction.get(attemptRef),
      ]);
      if (!quizSnapshot.exists() || !readQuiz(quizId, quizSnapshot.data()).isPublished) {
        throw new QuizServiceError('Kuis ini tidak tersedia.');
      }
      if (attemptSnapshot.exists()) {
        throw new QuizServiceError('Kuis ini sudah pernah Anda kerjakan.');
      }

      const submittedAt = serverTimestamp();
      transaction.set(attemptRef, {
        quizId,
        studentId,
        selectedAnswers,
        questionCount,
        submittedAt,
      });
      return {
        quizId,
        studentId,
        selectedAnswers,
        questionCount,
        submittedAt: new Date().toISOString(),
      };
    });
  } catch (error: unknown) {
    handleQuizServiceError(error, OperationType.CREATE, `quizzes/${quizId}/attempts/${studentId}`);
  }
}

export async function getQuizAnswerKeys(
  quizId: string
): Promise<Record<string, QuizAnswerKey>> {
  try {
    const snapshots = await getDocs(collection(db, 'quizzes', quizId, 'answerKeys'));
    const answerKeys: Record<string, QuizAnswerKey> = {};
    snapshots.docs.forEach((snapshot) => {
      answerKeys[snapshot.id] = readAnswerKey(snapshot.data());
    });
    return answerKeys;
  } catch (error: unknown) {
    handleFirestoreError(error, OperationType.LIST, `quizzes/${quizId}/answerKeys`);
  }
}
