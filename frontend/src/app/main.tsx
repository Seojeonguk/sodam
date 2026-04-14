import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import App from "./App";

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
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    h3: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h6: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
      letterSpacing: "-0.01em",
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.55,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at top left, rgba(223, 249, 229, 0.95), transparent 32%), radial-gradient(circle at top right, rgba(255, 214, 216, 0.7), transparent 24%), linear-gradient(180deg, #f7fbf8 0%, #f3f5f7 100%)",
        },
        "#root": {
          minHeight: "100vh",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(224, 224, 224, 0.88)",
          boxShadow: "0 18px 45px rgba(31, 41, 55, 0.06)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.82)",
          color: "#333333",
          backdropFilter: "blur(18px)",
          boxShadow: "0 12px 30px rgba(31, 41, 55, 0.08)",
          borderBottom: "1px solid rgba(224, 224, 224, 0.75)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 46,
          borderRadius: 10,
          paddingInline: 18,
        },
        containedPrimary: {
          color: "#28433c",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#A8E6CF",
          },
          "&.Mui-focused": {
            boxShadow: "0 0 0 4px rgba(168, 230, 207, 0.18)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(18px)",
          borderRight: "1px solid rgba(224, 224, 224, 0.75)",
        },
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <CssBaseline />
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
