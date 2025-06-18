import "./App.css";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import TransactionPage from "./features/transaction/TransactionPage";

function App() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        padding: 0,
      }}
    >
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            💰 소담
          </Typography>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth="md"
        sx={{
          flexGrow: 1,
          mt: 4,
          mb: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TransactionPage />
      </Container>
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
