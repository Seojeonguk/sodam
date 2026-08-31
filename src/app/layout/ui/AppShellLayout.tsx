import { useCallback, useState } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import SideBarDrawer from "./SideBarDrawer";
import { DRAWER_WIDTH } from "../../../shared/config/layout";
import { useIsDesktop } from "../../../shared/lib/useIsDesktop";
import { MobileBottomNav } from "../../../shared/ui/MobileBottomNav";
import TransactionCreateModal from "../../../features/transaction/ui/TransactionCreateModal";

/** 거래 추가 완료 시 다른 페이지(useTransactions)가 감지할 수 있는 전역 이벤트 */
export const TRANSACTION_ADDED_EVENT = "sodam:transaction-added";

function AppShellLayout() {
  const [openSide, setOpenSide] = useState<boolean>(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const theme = useTheme();

  const toggleDrawer = useCallback(
    () => setOpenSide((prev) => !prev),
    [],
  );
  const handleDrawerClose = useCallback(() => setOpenSide(false), []);

  const handleQuickAddSuccess = useCallback(async () => {
    // 각 페이지의 useTransactions가 이벤트를 구독해 자동 새로고침
    window.dispatchEvent(new CustomEvent(TRANSACTION_ADDED_EVENT));
  }, []);

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

      {/* 메인 콘텐츠 */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          transition: "margin 0.3s ease",
          marginLeft: openSide && isDesktop ? `${DRAWER_WIDTH}px` : 0,
          paddingTop: isDesktop ? "96px" : "80px",
          paddingInline: { xs: 0, md: 3 },
          // 모바일 하단 BottomNav 높이만큼 패딩
          paddingBottom: { xs: "72px", md: 0 },
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

      {/* 데스크톱 푸터 */}
      <Box
        component="footer"
        sx={{
          display: { xs: "none", md: "block" },
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

      {/* 모바일 하단 내비게이션 */}
      <MobileBottomNav
        onAddClick={() => setIsQuickAddOpen(true)}
        onMenuClick={toggleDrawer}
      />

      {/* 쉘 레벨 거래 추가 모달 (FAB에서 트리거) */}
      <TransactionCreateModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={handleQuickAddSuccess}
      />
    </Box>
  );
}

export default AppShellLayout;
