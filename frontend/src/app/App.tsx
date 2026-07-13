import { memo, useEffect, useState, type ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import LoginPage from "../pages/login/ui/LoginPage";
import TransactionPage from "../pages/transaction/ui/TransactionPage";
import CategoryPage from "../pages/category/ui/CategoryPage";
import DashboardPage from "../pages/dashboard/ui/DashboardPage";
import SignupPage from "../pages/signup/ui/SignupPage";
import { getAccessToken, restoreSession } from "../shared/api/api";
import { AccountBookProvider } from "../entities/accountbook/model/AccountBookContext";
import AuthLayout from "./layout/ui/AuthLayout";
import AppShellLayout from "./layout/ui/AppShellLayout";
import { useOfflineSync } from "../shared/lib/useOfflineSync";
import { OfflineBanner } from "../shared/ui/OfflineBanner";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const [isChecking, setIsChecking] = useState<boolean>(() => !getAccessToken());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(getAccessToken()),
  );

  useEffect(() => {
    if (getAccessToken()) {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      const restored = await restoreSession();

      if (!isMounted) {
        return;
      }

      setIsAuthenticated(restored);
      setIsChecking(false);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

const AppRoutes = memo(function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppShellLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionPage />} />
        <Route path="/category" element={<CategoryPage />} />
      </Route>
    </Routes>
  );
});

function App() {
  const { isOnline, pendingCount } = useOfflineSync();

  return (
    <AccountBookProvider>
      {!isOnline && <OfflineBanner pendingCount={pendingCount} />}
      <AppRoutes />
    </AccountBookProvider>
  );
}

export default App;
