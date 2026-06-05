import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SuperAdminLayout, TenantAdminLayout } from './layouts/AdminLayout'
import { AppLayout } from './layouts/AppLayout'
import { SuperAdminOrganizationsPage } from './pages/admin/SuperAdminOrganizationsPage'
<<<<<<< Updated upstream
import { SuperAdminUsersPage } from './pages/admin/SuperAdminUsersPage'
=======
>>>>>>> Stashed changes
import { SuperAdminVoiceProvidersPage } from './pages/admin/SuperAdminVoiceProvidersPage'
import { TenantAdminAnalyticsPage } from './pages/admin/TenantAdminAnalyticsPage'
import { TenantAdminUsersPage } from './pages/admin/TenantAdminUsersPage'
import { TenantAdminVoiceProvidersPage } from './pages/admin/TenantAdminVoiceProvidersPage'
import { HistoryPage } from './pages/HistoryPage'
import { JoinSessionPage } from './pages/JoinSessionPage'
import { LanguageSetupPage } from './pages/LanguageSetupPage'
import { LoginPage } from './pages/LoginPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { TranslatorPage } from './pages/TranslatorPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, canAccessHistory } = useAuth()
  if (!user) return <Navigate to="/app/translate" replace />
  if (!canAccessHistory) return <Navigate to="/app/translate" replace />
  return <>{children}</>
}

function LanguageSetupGuard() {
  const { user, isGuest } = useAuth()
  if (!user && !isGuest) return <Navigate to="/login" replace />
  return <LanguageSetupPage />
}

function RootRedirect() {
  const { user, isGuest } = useAuth()
  if (user || isGuest) return <Navigate to="/app/translate" replace />
  return <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/join/:sessionId" element={<JoinSessionPage />} />
      <Route path="/setup/languages" element={<LanguageSetupGuard />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="translate" replace />} />
        <Route path="translate" element={<TranslatorPage />} />
        <Route
          path="history"
          element={
            <RequireAuth>
              <HistoryPage />
            </RequireAuth>
          }
        />
        <Route
          path="history/:sessionId"
          element={
            <RequireAuth>
              <SessionDetailPage />
            </RequireAuth>
          }
        />
        <Route path="admin" element={<TenantAdminLayout />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<TenantAdminUsersPage />} />
          <Route path="analytics" element={<TenantAdminAnalyticsPage />} />
          <Route path="voice-providers" element={<TenantAdminVoiceProvidersPage />} />
        </Route>
        <Route path="super-admin" element={<SuperAdminLayout />}>
          <Route index element={<Navigate to="organizations" replace />} />
          <Route path="organizations" element={<SuperAdminOrganizationsPage />} />
<<<<<<< Updated upstream
          <Route path="users" element={<SuperAdminUsersPage />} />
=======
>>>>>>> Stashed changes
          <Route path="voice-providers" element={<SuperAdminVoiceProvidersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
