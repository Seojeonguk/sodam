import { memo, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  styled,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MuiAppBar, {
  type AppBarProps as MuiAppBarProps,
} from "@mui/material/AppBar";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useNavigate } from "react-router-dom";
import { DRAWER_WIDTH } from "../../../shared/config/layout";
import { useIsDesktop } from "../../../shared/lib/useIsDesktop";
import { clearAccessToken } from "../../../shared/api/api";
import { supabase } from "../../../shared/lib/supabase";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
import { guestMode } from "../../../shared/lib/guestMode";
import { GuestMigrationModal } from "../../../features/auth/ui/GuestMigrationModal";
import { useColorMode } from "../../../shared/lib/ColorModeContext";

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

interface HeaderProps {
  openSide: boolean;
  toggleDrawer: () => void;
}

interface StyledAppBarProps extends AppBarProps {
  isDesktop: boolean;
}

const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "isDesktop",
})<StyledAppBarProps>(({ theme, open, isDesktop }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open &&
    isDesktop && {
      width: `calc(100% - ${DRAWER_WIDTH}px)`,
      marginLeft: `${DRAWER_WIDTH}px`,
      transition: theme.transitions.create(["margin", "width"], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
}));

const iconButtonSx = {
  border: "1px solid",
  borderColor: "divider",
  color: "text.secondary",
  "&:hover": { color: "text.primary" },
};

function HeaderComponent({ openSide, toggleDrawer }: HeaderProps) {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const isDesktop = useIsDesktop();
  const nav = useNavigate();
  const { resetAccountBooks } = useAccountBookContext();
  const [migrationOpen, setMigrationOpen] = useState(false);

  const handleLogoClick = () => { void nav("/dashboard"); };

  const handleLogout = async () => {
    const isGuest = guestMode.isActive();
    const confirmMsg = isGuest
      ? "게스트 모드를 종료하시겠습니까? 저장된 데이터가 모두 삭제됩니다."
      : "로그아웃 하시겠습니까?";

    if (window.confirm(confirmMsg)) {
      if (isGuest) {
        guestMode.clearAll();
        resetAccountBooks();
        void nav("/");
        return;
      }
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Logout failed", error);
      } finally {
        clearAccessToken();
        resetAccountBooks();
        void nav("/");
      }
    }
  };

  return (
    <>
      <StyledAppBar position="fixed" open={openSide} isDesktop={isDesktop}>
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 1.5, md: 3 } }}>
          {/* 메뉴 버튼 */}
          <IconButton
            aria-label="open drawer"
            onClick={toggleDrawer}
            edge="start"
            sx={[iconButtonSx, { mr: 1.5 }, { display: { xs: "none", md: "flex" } }, openSide && { display: "none" }]}
          >
            <MenuIcon />
          </IconButton>

          {/* 로고 + 게스트 뱃지 */}
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              variant="h6"
              fontWeight={800}
              color="primary.dark"
              sx={{ cursor: "pointer" }}
              onClick={handleLogoClick}
            >
              Sodam
            </Typography>
            {guestMode.isActive() && (
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: alpha("#f59e0b", 0.12),
                  border: "1px solid",
                  borderColor: alpha("#f59e0b", 0.35),
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#d97706",
                  lineHeight: 1.6,
                }}
              >
                게스트
              </Box>
            )}
          </Box>

          {/* 계정 연동 버튼 (게스트 전용) */}
          {guestMode.isActive() && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<CloudUploadIcon fontSize="small" />}
              onClick={() => setMigrationOpen(true)}
              sx={{
                mr: 1,
                borderRadius: 2,
                fontSize: "0.75rem",
                whiteSpace: "nowrap",
                borderColor: alpha(theme.palette.info.main, 0.5),
                color: "info.dark",
                "&:hover": {
                  borderColor: "info.main",
                  bgcolor: alpha(theme.palette.info.main, 0.06),
                },
              }}
            >
              {isDesktop ? "계정 만들고 연동하기" : "연동"}
            </Button>
          )}

          {/* 다크모드 토글 */}
          <Tooltip title={mode === "dark" ? "라이트 모드" : "다크 모드"}>
            <IconButton
              onClick={toggleColorMode}
              sx={{ ...iconButtonSx, mr: 1 }}
            >
              {mode === "dark" ? (
                <LightModeIcon fontSize="small" />
              ) : (
                <DarkModeIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          {/* 로그아웃 */}
          <Tooltip title={guestMode.isActive() ? "게스트 종료" : "로그아웃"}>
            <IconButton
              onClick={() => void handleLogout()}
              sx={iconButtonSx}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </StyledAppBar>

      <GuestMigrationModal
        open={migrationOpen}
        onClose={() => setMigrationOpen(false)}
      />
    </>
  );
}

export default memo(HeaderComponent);
