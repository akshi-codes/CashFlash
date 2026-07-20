import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/shared/ThemeProvider";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { Toaster } from "./components/ui/sonner";

import { useSelector } from "react-redux";
import { appConfig } from "./config/appConfig";

function ProtectedRoute({ children }) {
  const { isHydrated, isLoggedIn } = useSelector((state) => state.auth);

  if (!isHydrated) {
    return null;
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="theme">
      <Routes>
        <Route path={appConfig.routes.root} element={<Navigate to={appConfig.routes.landing} />} />
        <Route path={appConfig.routes.signup} element={<SignupPage />} />
        <Route path={appConfig.routes.login} element={<LoginPage />} />
        <Route path={appConfig.routes.resetPassword} element={<ResetPasswordPage />} />

        <Route
          path={appConfig.routes.dashboard}
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route path={appConfig.routes.landing} element={<LandingPage />} />
      </Routes>

      <Toaster />
    </ThemeProvider>
  );
}

export default App;
