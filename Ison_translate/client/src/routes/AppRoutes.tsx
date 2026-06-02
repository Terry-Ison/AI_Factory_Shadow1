import { useAuth } from "../context/AuthContext"
import { AppLayout } from "../layouts/AppLayout"
import { LoginPage } from "../pages/LoginPage"
import { TranslatorPage } from "../pages/TranslatorPage"
import { HistoryPage } from "../pages/HistoryPage"
import { DashboardPage } from "../pages/DashboardPage"
import { SettingPage } from "../pages/SettingPage"
import { SessionDetailPage } from "../pages/SessionDetailPage"
import { Navigate, Route, Routes } from "react-router-dom"
import { LanguageSetupPage } from "../pages/LanguageSetupPage"


function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    if (!user) return <Navigate to="/app/translate" replace />
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

export function AppRoutes() {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
            path="dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="settings"
            element={
              <RequireAuth>
                <SettingPage />
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
        </Route>
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    )
  }