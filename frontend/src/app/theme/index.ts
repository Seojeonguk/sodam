import { createTheme, type PaletteMode } from "@mui/material/styles";

export const getTheme = (mode: PaletteMode) => {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#6ECFA0" : "#A8E6CF",
        light: isDark ? "#A8E6CF" : "#DFF9E5",
        dark: isDark ? "#4BB882" : "#7FC1A8",
        contrastText: isDark ? "#0B1F17" : "#28433c",
      },
      secondary: {
        main: isDark ? "#FF9DA0" : "#FFB6B9",
        light: isDark ? "#FFBDBF" : "#FFD6D8",
        dark: isDark ? "#CC7174" : "#E18A8D",
        contrastText: isDark ? "#1A0A0B" : "#333333",
      },
      success: {
        main: isDark ? "#4ADE80" : "#C8E6C9",
        light: isDark ? "#86EFAC" : "#E8F5E9",
        dark: isDark ? "#22C55E" : "#2E7D32",
        contrastText: isDark ? "#052e16" : "#1B5E20",
      },
      error: {
        main: isDark ? "#F87171" : "#FF8A80",
        light: isDark ? "#FCA5A5" : "#FFCDD2",
        dark: isDark ? "#EF4444" : "#C62828",
        contrastText: isDark ? "#450a0a" : "#B71C1C",
      },
      warning: {
        main: isDark ? "#FBBF24" : "#FFF3B0",
        dark: isDark ? "#D97706" : "#F59E0B",
      },
      info: {
        main: isDark ? "#60A5FA" : "#AECBFA",
        dark: isDark ? "#3B82F6" : "#1976D2",
      },
      background: {
        default: isDark ? "#111318" : "#F0F2F5",
        paper: isDark ? "#1C2030" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#F1F5F9" : "#333333",
        secondary: isDark ? "#94A3B8" : "#666666",
        disabled: isDark ? "#475569" : "#9E9E9E",
      },
      divider: isDark ? "rgba(255,255,255,0.08)" : "#E0E0E0",
    },

    typography: {
      fontFamily: ["Noto Sans KR", "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),
      h1: { fontWeight: 800, letterSpacing: "-0.03em" },
      h2: { fontWeight: 800, letterSpacing: "-0.03em" },
      h3: { fontWeight: 800, letterSpacing: "-0.02em" },
      h4: { fontWeight: 700, letterSpacing: "-0.02em" },
      h5: { fontWeight: 700, letterSpacing: "-0.015em" },
      h6: { fontWeight: 700, letterSpacing: "-0.01em" },
      button: { fontWeight: 700, textTransform: "none", letterSpacing: "-0.01em" },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.55 },
    },

    shape: { borderRadius: 12 },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: isDark
            ? {
                background: "#111318",
              }
            : {
                background:
                  "radial-gradient(circle at top left, rgba(223,249,229,0.95), transparent 32%), radial-gradient(circle at top right, rgba(255,214,216,0.7), transparent 24%), linear-gradient(180deg, #f7fbf8 0%, #f3f5f7 100%)",
              },
          "#root": { minHeight: "100vh" },
        },
      },

      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: isDark
            ? {
                backgroundImage: "none",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }
            : {
                backgroundImage: "none",
                border: "1px solid rgba(224,224,224,0.88)",
                boxShadow: "0 4px 20px rgba(31,41,55,0.05)",
              },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: isDark
            ? {
                backgroundColor: "rgba(28,32,48,0.92)",
                color: "#F1F5F9",
                backdropFilter: "blur(18px)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.06)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }
            : {
                backgroundColor: "rgba(255,255,255,0.82)",
                color: "#333333",
                backdropFilter: "blur(18px)",
                boxShadow: "0 1px 0 rgba(31,41,55,0.08)",
                borderBottom: "1px solid rgba(224,224,224,0.75)",
              },
        },
      },

      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { minHeight: 46, borderRadius: 10, paddingInline: 18 },
          containedPrimary: {
            color: isDark ? "#0B1F17" : "#28433c",
          },
        },
      },

      MuiTextField: {
        defaultProps: { variant: "outlined", fullWidth: true },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
            transition: "box-shadow 0.2s ease, border-color 0.2s ease",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "#6ECFA0" : "#A8E6CF",
            },
            "&.Mui-focused": {
              boxShadow: isDark
                ? "0 0 0 4px rgba(110,207,160,0.15)"
                : "0 0 0 4px rgba(168,230,207,0.18)",
            },
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 999, fontWeight: 600 },
        },
      },

      MuiDrawer: {
        styleOverrides: {
          paper: isDark
            ? {
                backgroundColor: "rgba(28,32,48,0.97)",
                backdropFilter: "blur(18px)",
                borderRight: "1px solid rgba(255,255,255,0.06)",
              }
            : {
                backgroundColor: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(18px)",
                borderRight: "1px solid rgba(224,224,224,0.75)",
              },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E0E0E0",
          },
        },
      },
    },
  });
};
