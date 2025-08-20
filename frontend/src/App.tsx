import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import LoginPage from "./pages/LoginPage";

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
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          color: "#333333",
          borderBottom: "1px solid #E0E0E0",
        }}
      >
        <Toolbar sx={{ minHeight: 56 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            💰 소담
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        maxWidth="md"
        sx={{
          flexGrow: 1,
          mt: 4,
          mb: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <LoginPage />
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
