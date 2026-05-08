import { useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore } from './store';
import { authApi } from './services/api';
import { onAppStateChange, getLastBackgroundTimestamp } from './native/native-ux';
import { isIOS } from './native/platform';
import {
  LandingPage,
  LoginPage,
  SignupPage,
  ForgotPasswordPage,
  DashboardPage,
  CapturePage,
  DictationPage,
  UploadPage,
  NotesPage,
  NoteEditorPage,
  PatientPage,
  PatientsListPage,
  TemplatesPage,
  TemplateEditorPage,
  HelpCenterPage,
  DemoSessionPage,
  SettingsPage,
  AdminPage,
  TeamPage,
  AnalyticsPage,
  HipaaBaaPage,
  SubscriptionLockedPage,
  TermsPage,
  PrivacyPage,
  DeleteAccountPage,
  EnterprisePage,
} from './pages';

// HIPAA: Session inactivity timeout (30 minutes)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Protected Route component with subscription check
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if subscription is inactive (locked account)
  if (user?.subscriptionStatus === 'inactive') {
    return <Navigate to="/subscription-locked" replace />;
  }
  
  return <>{children}</>;
}

// Locked Route - only accessible when subscription is inactive
function LockedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If subscription is active, redirect to dashboard
  if (user?.subscriptionStatus !== 'inactive') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

// Admin Route component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const { checkAuth, logout, isAuthenticated } = useAuthStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // HIPAA: Auto-logout on inactivity
  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!isAuthenticated) return;

    timeoutRef.current = setTimeout(() => {
      logout();
      toast.error('Session expired due to inactivity. Please log in again.', { duration: 5000 });
    }, SESSION_TIMEOUT_MS);
  }, [isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start the timer

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isAuthenticated, resetTimer]);

  // HIPAA: also enforce inactivity timeout across native app background/foreground
  // transitions. The in-process setTimeout above doesn't fire while the OS has the
  // app suspended, so when the user comes back we check how long it was backgrounded.
  // This is the "did you leave your phone on the table for an hour?" case.
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onAppStateChange((state) => {
      if (state.isActive) {
        const backgroundedAt = getLastBackgroundTimestamp();
        if (backgroundedAt && Date.now() - backgroundedAt >= SESSION_TIMEOUT_MS) {
          logout();
          toast.error('Session expired while the app was in the background. Please log in again.', {
            duration: 5000,
          });
        } else {
          // App is back in the foreground — restart the inactivity timer.
          resetTimer();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, logout, resetTimer]);

  // HIPAA: Proactive token refresh (refresh at 23h to avoid expiry mid-session)
  useEffect(() => {
    if (!isAuthenticated) return;
    const refreshInterval = setInterval(async () => {
      try {
        const resp = await authApi.refresh();
        if (resp?.token) {
          useAuthStore.setState({ token: resp.token });
        }
      } catch {
        // Token expired or invalid — force logout
        logout();
        toast.error('Session expired. Please log in again.', { duration: 5000 });
      }
    }, 23 * 60 * 60 * 1000); // 23 hours

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, logout]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        {/*
          On iOS we skip the marketing LandingPage entirely. It contains pricing
          tiers and Stripe-based "Start Free Trial" CTAs which violate Apple's
          anti-steering rules (Guideline 3.1.1). Sending iOS users straight to
          /login keeps the install flow legal and doesn't waste reviewer time
          on marketing copy. Web users still see the full landing page.
        */}
        <Route path="/" element={isIOS() ? <Navigate to="/login" replace /> : <LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/delete-account" element={<DeleteAccountPage />} />
        
        {/* Subscription Locked Route */}
        <Route
          path="/subscription-locked"
          element={
            <LockedRoute>
              <SubscriptionLockedPage />
            </LockedRoute>
          }
        />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/capture"
          element={
            <ProtectedRoute>
              <CapturePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dictation"
          element={
            <ProtectedRoute>
              <DictationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <NotesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes/:id"
          element={
            <ProtectedRoute>
              <NoteEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <PatientsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:patientName"
          element={
            <ProtectedRoute>
              <PatientPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <TemplatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates/new"
          element={
            <ProtectedRoute>
              <TemplateEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates/:id/edit"
          element={
            <ProtectedRoute>
              <TemplateEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpCenterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/demo"
          element={
            <ProtectedRoute>
              <DemoSessionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <TeamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hipaa-baa"
          element={
            <ProtectedRoute>
              <HipaaBaaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enterprise"
          element={
            <ProtectedRoute>
              <EnterprisePage />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        
        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
