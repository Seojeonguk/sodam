import { memo } from "react";
import {
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  styled,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import MuiAppBar, {
  type AppBarProps as MuiAppBarProps,
} from "@mui/material/AppBar";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import LoginApi from "../../../features/auth/api/LoginApi";
import { DRAWER_WIDTH } from "../../../shared/config/layout";
import { useIsDesktop } from "../../../shared/lib/useIsDesktop";
import { clearAccessToken } from "../../../shared/api/api";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
import { guestMode } from "../../../shared/lib/guestMode";

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
  boxShadow: "none",
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

function HeaderComponent({ openSide, toggleDrawer }: HeaderProps) {
  const isDesktop = useIsDesktop();
  const nav = useNavigate();
  const { resetAccountBooks } = useAccountBookContext();

  const handleLogoClick = () => {
    void nav("/dashboard");
  };

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
        await LoginApi.logout();
      } catch (error) {
        console.error("Logout API failed", error);
      } finally {
        clearAccessToken();
        resetAccountBooks();
        void nav("/");
      }
    }
  };

  return (
    <StyledAppBar position="fixed" open={openSide} isDesktop={isDesktop}>
      <Toolbar sx={{ minHeight: { xs: 64, md: 76 }, px: { xs: 1.5, md: 3 } }}>
        <IconButton
          color="default"
          aria-label="open drawer"
          onClick={toggleDrawer}
          edge="start"
          sx={[
            {
              mr: 1.5,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: alpha("#ffffff", 0.74),
            },
            openSide && { display: "none" },
          ]}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ cursor: "pointer", display: "inline-block" }}
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
                bgcolor: alpha("#f59e0b", 0.15),
                border: "1px solid",
                borderColor: alpha("#f59e0b", 0.4),
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#b45309",
                lineHeight: 1.6,
              }}
            >
              게스트
            </Box>
          )}
        </Box>

        <Tooltip title={guestMode.isActive() ? "게스트 종료" : "로그아웃"}>
          <IconButton
            color="default"
            onClick={() => void handleLogout()}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              bgcolor: alpha("#ffffff", 0.74),
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </StyledAppBar>
  );
}

export default memo(HeaderComponent);
