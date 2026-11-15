/**
 * @fileoverview Centralized TypeScript types and interfaces for OnlineQuiz.
 * Enforces strict typing across auth, Firestore entities, REST API, and LLM payloads.
 */

export type UserRole = 'student' | 'teacher';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type QuizDifficultyMode = DifficultyLevel | 'adaptive';

export type QuizSourceType = 'ai_topic' | 'ai_material' | 'opentdb_import' | 'manual';

export interface TopicMastery {
  totalAnswered: number;
  totalCorrect: number;
  currentDifficulty: DifficultyLevel;
  streak: number;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  masteryByTopic: Record<string, TopicMastery>;
  createdAt: string;
  updatedAt: string;
}

export interface Classroom {
  code: string;
  name: string;
  teacherId: string;
  teacherName: string;
  createdAt: string;
}

export interface ClassroomStudent {
  uid: string;
  displayName: string;
  joinedAt: string;
}

export interface StudentClass {
  code: string;
  name: string;
  teacherId: string;
  teacherName: string;
  joinedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: QuizDifficultyMode;
  sourceType: QuizSourceType;
  sourceMaterialSnippet?: string;
  createdBy: string;
  creatorRole: UserRole;
  isPublished: boolean;
  questionCount: number;
  verifiedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestionDraft {
  stem: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3 | null;
  explanation: string;
}

export interface PublicQuizQuestion {
  id: string;
  stem: string;
  options: [string, string, string, string];
  order: number;
}

export interface QuizAnswerKey {
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface QuizAttempt {
  quizId: string;
  studentId: string;
  selectedAnswers: Record<string, 0 | 1 | 2 | 3>;
  questionCount: number;
  submittedAt: string;
}

export interface QuestionVerification {
  isVerified: boolean;
  confidenceScore: number;
  issuesFound: string[];
  repaired: boolean;
}

export interface Question {
  id: string;
  quizId: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: DifficultyLevel;
  stem: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  verification: QuestionVerification;
  status: 'active' | 'flagged' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticFeedback {
  misconceptionDiagnosis: string;
  correctExplanation: string;
  memoryTip: string;
}

export interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  subtopic: string;
  difficulty: DifficultyLevel;
  selectedIndex: 0 | 1 | 2 | 3;
  correctIndex: 0 | 1 | 2 | 3;
  isCorrect: boolean;
  diagnosticFeedback?: DiagnosticFeedback;
  answeredAt: string;
}

export interface StudyRecommendation {
  summary: string;
  priorityTopics: Array<{
    subtopic: string;
    accuracy: number;
    actionTip: string;
  }>;
}

export interface Attempt {
  id: string;
  quizId: string;
  quizTitle: string;
  userId: string;
  mode: 'standard' | 'adaptive' | 'remedial';
  status: 'in_progress' | 'completed';
  score: number;
  correctCount: number;
  totalQuestions: number;
  difficultyTrajectory: DifficultyLevel[];
  weakSubtopics: string[];
  studyPlan?: StudyRecommendation;
  startedAt: string;
  completedAt?: string;
}

export interface AITriageResult {
  classification: 'confirmed_defect' | 'needs_review' | 'likely_false_positive';
  confidence: number;
  rationale: string;
  suggestedCorrection?: string;
}

export interface QuestionReport {
  id: string;
  questionId: string;
  quizId: string;
  reportedBy: string;
  reporterEmail: string;
  reasonCategory:
    | 'wrong_answer'
    | 'confusing_wording'
    | 'poor_distractors'
    | 'out_of_scope'
    | 'duplicate_option';
  comment: string;
  aiTriage: AITriageResult;
  reviewStatus: 'pending' | 'resolved_edited' | 'resolved_archived' | 'dismissed';
  reviewedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export type LLMTaskType =
  | 'generate_mcq'
  | 'verify_mcq'
  | 'diagnostic_feedback'
  | 'triage_report'
  | 'study_plan'
  | 'teacher_insights';

export interface LLMRequest {
  task: LLMTaskType;
  payload: {
    subject?: string;
    topic?: string;
    subtopic?: string;
    difficulty?: DifficultyLevel;
    count?: number;
    materialText?: string;
    previousMistakes?: Array<{ stem: string; subtopic: string; isCorrect: boolean }>;
    question?: Pick<Question, 'stem' | 'options' | 'correctIndex' | 'explanation'>;
    selectedWrongOption?: string;
    reportReason?: string;
    reportComment?: string;
    attemptSummary?: {
      subject: string;
      score: number;
      wrongAnswers: Array<{
        stem: string;
        subtopic: string;
        selectedOption: string;
        correctOption: string;
      }>;
    };
  };
}

export interface LLMResponse<TData> {
  task: LLMTaskType;
  model: string;
  latencyMs: number;
  schemaValid: boolean;
  verificationPassed?: boolean;
  data: TData;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    latencyMs?: number;
  };
}

export type AuthMode = 'login' | 'register' | 'reset';

export interface AuthFormErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  displayName: string;
  email: string;
  password: string;
}

export interface AuthContextValue {
  userProfile: User | null;
  firebaseUid: string | null;
  emailVerified: boolean;
  loading: boolean;
  actionLoading: boolean;
  authError: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateDisplayName: (displayName: string) => Promise<boolean>;
  clearError: () => void;
}
