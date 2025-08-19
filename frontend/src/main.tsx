import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    primary: {
      main: "#A8E6CF",
      light: "#DFF9E5",
      dark: "#7FC1A8",
      contrastText: "#333333",
    },
    secondary: {
      main: "#FFB6B9",
      light: "#FFD6D8",
      dark: "#E18A8D",
      contrastText: "#333333",
    },
    success: {
      main: "#C8E6C9",
    },
    warning: {
      main: "#FFF3B0",
    },
    error: {
      main: "#FF8A80",
    },
    info: {
      main: "#AECBFA",
    },
    background: {
      default: "#F0F2F5",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#333333",
      secondary: "#666666",
    },
    divider: "#E0E0E0",
  },
  typography: {
    fontFamily: [
      "Noto Sans KR",
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
  },
  shape: {
    borderRadius: 12,
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
