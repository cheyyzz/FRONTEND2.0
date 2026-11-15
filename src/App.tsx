import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { QuizTakePage } from './pages/QuizTakePage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { TeacherDashboardPage } from './pages/TeacherDashboardPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

/**
 * Root application shell configuring React Router, AuthProvider, and role-based routes.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route
                path="/quizzes/:quizId"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <QuizTakePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher']}>
                    <StudentDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/teacher/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          <footer className="border-t border-slate-200 bg-white py-6">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
              <span>OnlineQuiz — Kuis Perkuliahan</span>
              <span>React · TypeScript · Firebase Auth &amp; Cloud Firestore</span>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
