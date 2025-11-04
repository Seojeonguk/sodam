import { Box, Typography } from "@mui/material";
import LoginPage from "./pages/LoginPage";
import { Route, Routes } from "react-router-dom";
import TransactionPage from "./features/transaction/TransactionPage";
import SideBarDrawer from "./components/layout/SideBarDrawer";

function App() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        padding: 0,
      }}
    >
      <SideBarDrawer />
      <Box
        sx={{
          flexGrow: 1,
          mt: 4,
          mb: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/transactions" element={<TransactionPage />} />
        </Routes>
      </Box>
      <Box
        component="footer"
        sx={{
          p: 2,
          mt: "auto",
          backgroundColor: "#e0e0e0",
          textAlign: "center",
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
