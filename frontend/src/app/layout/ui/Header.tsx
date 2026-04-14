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
    if (window.confirm("로그아웃 하시겠습니까?")) {
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

        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ cursor: "pointer", display: "inline-block" }}
            onClick={handleLogoClick}
          >
            Sodam
          </Typography>
        </Box>

        <Tooltip title="로그아웃">
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
