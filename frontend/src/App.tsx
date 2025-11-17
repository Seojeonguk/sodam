import { Box, Typography } from "@mui/material";
import LoginPage from "./pages/LoginPage";
import { Route, Routes } from "react-router-dom";
import TransactionPage from "./features/transaction/TransactionPage";
import SideBarDrawer from "./components/layout/SideBarDrawer";
import { useState } from "react";
import CategoryPage from "./features/category/CategoryPage.tsx";

const drawerWidth = 240;
function App() {
  const [openSide, setOpenSide] = useState<boolean>(false);

  const toggleDrawer = () => setOpenSide(!openSide);
  const handleDrawerClose = () => setOpenSide(false);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        padding: 0,
      }}
    >
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
          marginLeft: openSide ? `${drawerWidth}px` : 0,
          marginTop: 0,
        }}
      >
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/transactions" element={<TransactionPage />} />
          <Route path="/category" element={<CategoryPage />} />
        </Routes>
      </Box>
      <Box
        component="footer"
        sx={{
          p: 2,
          mt: "auto",
          backgroundColor: "#e0e0e0",
          textAlign: "center",
          transition: "margin 0.3s ease",
          marginLeft: openSide ? `${drawerWidth}px` : 0,
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
