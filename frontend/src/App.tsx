import { Box, Typography } from "@mui/material";
import LoginPage from "./pages/LoginPage";
import { Route, Routes } from "react-router-dom";
import TransactionPage from "./features/transaction/TransactionPage";
import SideBarDrawer from "./components/layout/SideBarDrawer";
import { memo, useCallback, useState } from "react";
import CategoryPage from "./features/category/CategoryPage.tsx";
import Header from "./components/layout/Header.tsx";
import { DRAWER_WIDTH } from "./constants/layout";
import { useIsDesktop } from "./hooks/useIsDesktop";
import DashboardPage from "./features/dashboard/DashboardPage.tsx";
import { AccountBookProvider } from "./features/accountbook/context/AccountBookContext";

const AppRoutes = memo(function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
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
