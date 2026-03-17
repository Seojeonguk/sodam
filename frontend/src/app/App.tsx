import { Box, Typography } from "@mui/material";
import LoginPage from "../pages/login/ui/LoginPage";
import { Route, Routes } from "react-router-dom";
import TransactionPage from "../pages/transaction/ui/TransactionPage";
import SideBarDrawer from "../widgets/layout/ui/SideBarDrawer";
import { memo, useCallback, useState } from "react";
import CategoryPage from "../pages/category/ui/CategoryPage";
import Header from "../widgets/layout/ui/Header";
import { DRAWER_WIDTH } from "../shared/config/layout";
import { useIsDesktop } from "../shared/lib/useIsDesktop";
import DashboardPage from "../pages/dashboard/ui/DashboardPage";
import { AccountBookProvider } from "../entities/accountbook/model/AccountBookContext";
import SignupPage from "../pages/signup/ui/SignupPage";

const AppRoutes = memo(function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/transactions" element={<TransactionPage />} />
      <Route path="/category" element={<CategoryPage />} />
    </Routes>
  );
});

function App() {
  const [openSide, setOpenSide] = useState<boolean>(false);
  const isDesktop = useIsDesktop(); // sm 이상이면 데스크탑

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
            mt: 4,
            mb: 4,
            display: "flex",
            flexDirection: "column",
            transition: "margin 0.3s ease",
            marginLeft: openSide && isDesktop ? `${DRAWER_WIDTH}px` : 0,
            marginTop: 0,
            paddingTop: isDesktop ? "64px" : "56px",
          }}
        >
          <AppRoutes />
        </Box>
      </AccountBookProvider>
      <Box
        component="footer"
        sx={{
          p: 2,
          mt: "auto",
          backgroundColor: "#e0e0e0",
          textAlign: "center",
          transition: "margin 0.3s ease",
          marginLeft: openSide && isDesktop ? `${DRAWER_WIDTH}px` : 0,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © 2025 소담
        </Typography>
      </Box>
    </Box>
  );
}

export default App;
