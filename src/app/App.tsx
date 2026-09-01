import { memo, useEffect, useState, type ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import LoginPage from "../pages/login/ui/LoginPage";
import TransactionPage from "../pages/transaction/ui/TransactionPage";
import CategoryPage from "../pages/category/ui/CategoryPage";
import DashboardPage from "../pages/dashboard/ui/DashboardPage";
import BudgetPage from "../pages/budget/ui/BudgetPage";
import RecurringPage from "../pages/recurring/ui/RecurringPage";
import MemberStatsPage from "../pages/member-stats/ui/MemberStatsPage";
import AssetPage from "../pages/asset/ui/AssetPage";
import SignupPage from "../pages/signup/ui/SignupPage";
import { getAccessToken, restoreSession } from "../shared/api/api";
import { AccountBookProvider, useAccountBookContext } from "../entities/accountbook/model/AccountBookContext";
import AuthLayout from "./layout/ui/AuthLayout";
import AppShellLayout from "./layout/ui/AppShellLayout";
import { useOfflineSync } from "../shared/lib/useOfflineSync";
import { OfflineBanner } from "../shared/ui/OfflineBanner";
import { guestMode } from "../shared/lib/guestMode";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { fetchAccountBooks } = useAccountBookContext();

  const [isChecking, setIsChecking] = useState<boolean>(
    () => !getAccessToken() && !guestMode.isActive(),
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => Boolean(getAccessToken()) || guestMode.isActive(),
  );

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      // 이미 토큰이 있으면 바로 인증 처리 + 가계부 fetch
      if (getAccessToken() || guestMode.isActive()) {
        if (!guestMode.isActive()) {
          // 인증 유저: 새로고침 시 가계부 목록 복원
          await fetchAccountBooks().catch(() => {/* 실패해도 계속 */});
        }
        if (isMounted) {
          setIsAuthenticated(true);
          setIsChecking(false);
        }
        return;
      }

      const restored = await restoreSession();
      if (!isMounted) return;

      if (restored) {
        // 세션 복원 성공 시 가계부 목록 fetch
        await fetchAccountBooks().catch(() => {/* 실패해도 계속 */});
      }

      setIsAuthenticated(restored);
      setIsChecking(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [fetchAccountBooks]);

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
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/recurring" element={<RecurringPage />} />
        <Route path="/member-stats" element={<MemberStatsPage />} />
        <Route path="/assets" element={<AssetPage />} />
      </Route>
    </Routes>
  );
});

function App() {
  const { isOnline } = useOfflineSync();

  return (
    <AccountBookProvider>
      {!isOnline && <OfflineBanner />}
      <AppRoutes />
    </AccountBookProvider>
  );
}

export default App;
