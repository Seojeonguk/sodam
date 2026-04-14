import { memo, useCallback, useEffect, useState, type ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import LoginPage from "../pages/login/ui/LoginPage";
import TransactionPage from "../pages/transaction/ui/TransactionPage";
import CategoryPage from "../pages/category/ui/CategoryPage";
import DashboardPage from "../pages/dashboard/ui/DashboardPage";
import SignupPage from "../pages/signup/ui/SignupPage";
import SideBarDrawer from "./layout/ui/SideBarDrawer";
import Header from "./layout/ui/Header";
import { DRAWER_WIDTH } from "../shared/config/layout";
import { useIsDesktop } from "../shared/lib/useIsDesktop";
import { AccountBookProvider } from "../entities/accountbook/model/AccountBookContext";
import { getAccessToken, restoreSession } from "../shared/api/api";

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
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <TransactionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/category"
        element={
          <ProtectedRoute>
            <CategoryPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
});

function App() {
  const [openSide, setOpenSide] = useState<boolean>(false);
  const isDesktop = useIsDesktop();
  const theme = useTheme();

  const toggleDrawer = useCallback(
    () => setOpenSide((prevOpen) => !prevOpen),
    [],
  );
  const handleDrawerClose = useCallback(() => setOpenSide(false), []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        padding: 0,
      }}
    >
      <AccountBookProvider>
        <Header openSide={openSide} toggleDrawer={toggleDrawer} />
        <SideBarDrawer
          openSide={openSide}
          toggleDrawer={toggleDrawer}
          handleDrawerClose={handleDrawerClose}
        />
        <Box
          sx={{
            flexGrow: 1,
            mb: 4,
            display: "flex",
            flexDirection: "column",
            transition: "margin 0.3s ease",
            marginLeft: openSide && isDesktop ? `${DRAWER_WIDTH}px` : 0,
            paddingTop: isDesktop ? "96px" : "80px",
            paddingInline: { xs: 2, md: 3 },
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `radial-gradient(circle at 12% 10%, ${alpha(
                theme.palette.primary.main,
                0.16,
              )}, transparent 26%), radial-gradient(circle at 85% 18%, ${alpha(
                theme.palette.secondary.main,
                0.16,
              )}, transparent 24%)`,
            }}
          />
          <AppRoutes />
        </Box>
      </AccountBookProvider>
      <Box
        component="footer"
        sx={{
          px: 3,
          py: 2.5,
          mt: "auto",
          backdropFilter: "blur(12px)",
          backgroundColor: alpha(theme.palette.background.paper, 0.72),
          textAlign: "center",
          transition: "margin 0.3s ease",
          marginLeft: openSide && isDesktop ? `${DRAWER_WIDTH}px` : 0,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
        }}
      >
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          2025 SODAM
        </Typography>
      </Box>
    </Box>
  );
}

export default App;
