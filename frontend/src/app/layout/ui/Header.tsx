import { IconButton, Toolbar, Typography, styled, Box, Tooltip } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginApi from "../../../features/auth/api/LoginApi";
import MuiAppBar, {
  type AppBarProps as MuiAppBarProps,
} from "@mui/material/AppBar";
import { memo } from "react";
import { DRAWER_WIDTH } from "../../../shared/config/layout";
import { useIsDesktop } from "../../../shared/lib/useIsDesktop";
import { useNavigate } from "react-router-dom";

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

function HeaderComponent({ openSide, toggleDrawer }: HeaderProps) {
  const isDesktop = useIsDesktop(); // sm 이상이면 데스크탑

  const nav = useNavigate();

  const handleLogoClick = () => {
    void nav("/dashboard");
  };

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      try {
        await LoginApi.logout();
      } catch (error) {
        console.error("Logout API failed", error);
        // Fallback to client-side logout even if API fails
      } finally {
        localStorage.removeItem("accessToken");
        void nav("/");
      }
    }
  };

  return (
    <StyledAppBar position="fixed" open={openSide} isDesktop={isDesktop}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={toggleDrawer}
          edge="start"
          sx={[
            {
              mr: 2,
            },
            openSide && { display: "none" },
          ]}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Box
            component="span"
            sx={{ cursor: "pointer", display: "inline-block" }}
            onClick={handleLogoClick}
          >
            💰 소담
          </Box>
        </Typography>

        <Tooltip title="로그아웃">
          <IconButton color="inherit" onClick={() => void handleLogout()}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </StyledAppBar>
  );
}

export default memo(HeaderComponent);
