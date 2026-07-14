import { useCallback, useState } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import SideBarDrawer from "./SideBarDrawer";
import { DRAWER_WIDTH } from "../../../shared/config/layout";
import { useIsDesktop } from "../../../shared/lib/useIsDesktop";

function AppShellLayout() {
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
          /* xs에서는 각 페이지의 Container가 자체 패딩을 처리하므로 제거 */
          paddingInline: { xs: 0, md: 3 },
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
        <Outlet />
      </Box>

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

export default AppShellLayout;
