import { memo, useCallback, useState } from "react";
import { styled, useTheme, alpha } from "@mui/material/styles";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useLocation, useNavigate } from "react-router-dom";
import { DRAWER_WIDTH } from "../../../shared/config/layout";
import { useIsDesktop } from "../../../shared/lib/useIsDesktop";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
import type { AccountBookListResponse } from "../../../entities/accountbook/api/accountbook.types";
import LoginApi from "../../../features/auth/api/LoginApi";
import { clearAccessToken } from "../../../shared/api/api";

interface SideBarDrawerProps {
  openSide: boolean;
  toggleDrawer: () => void;
  handleDrawerClose: () => void;
}

const SIDE_MENU_ITEMS = [
  { label: "대시보드", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "거래 내역", path: "/transactions", icon: <ReceiptLongIcon /> },
  { label: "카테고리", path: "/category", icon: <CategoryIcon /> },
];

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "space-between",
}));

function SideBarDrawerComponent({
  openSide,
  toggleDrawer,
  handleDrawerClose,
}: SideBarDrawerProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const { accountBooks, currentAccountBook, setCurrentAccountBook, resetAccountBooks } =
    useAccountBookContext();
  const [repoAnchor, setRepoAnchor] = useState<HTMLElement | null>(null);

  const openRepoMenu = (event: React.MouseEvent<HTMLElement>) => {
    setRepoAnchor(event.currentTarget);
  };

  const closeRepoMenu = () => {
    setRepoAnchor(null);
  };

  const handleSelectAccountBook = (accountBook: AccountBookListResponse) => {
    setCurrentAccountBook(accountBook);
    closeRepoMenu();
  };

  const createNavigateHandler = useCallback(
    (path: string) => {
      return () => {
        void navigate(path);
        if (!isDesktop) {
          handleDrawerClose();
        }
      };
    },
    [navigate, isDesktop, handleDrawerClose],
  );

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            px: 1.5,
            py: 2,
          },
        }}
        variant={isDesktop ? "persistent" : "temporary"}
        anchor="left"
        open={openSide}
        onClose={handleDrawerClose}
      >
        <DrawerHeader>
          <Typography variant="h6" fontWeight={800} sx={{ px: 1 }}>
            Sodam
          </Typography>

          <IconButton
            onClick={toggleDrawer}
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            {theme.direction === "ltr" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </DrawerHeader>

        <Box sx={{ px: 1, pt: 1, pb: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 1.5, display: "block", mb: 0.8 }}
          >
            가계부
          </Typography>
          <ListItemButton
            onClick={openRepoMenu}
            sx={{
              minHeight: 52,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
              backgroundColor: alpha(theme.palette.primary.light, 0.28),
              justifyContent: "space-between",
              px: 1.5,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.light, 0.42),
              },
            }}
          >
            <Stack alignItems="flex-start" spacing={0.2}>
              <Typography
                sx={{
                  maxWidth: 170,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: "left",
                  fontWeight: 700,
                }}
              >
                {currentAccountBook?.name ?? "가계부를 선택해 주세요"}
              </Typography>
            </Stack>
            <ExpandMoreIcon fontSize="small" />
          </ListItemButton>

          <Menu
            anchorEl={repoAnchor}
            open={Boolean(repoAnchor)}
            onClose={closeRepoMenu}
            transformOrigin={{ horizontal: "left", vertical: "top" }}
            anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 232,
                  overflow: "hidden",
                  borderRadius: 1.5,
                  border: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.96),
                  backdropFilter: "blur(18px)",
                  boxShadow: "0 10px 24px rgba(31, 41, 55, 0.1)",
                  p: 0.5,
                },
              },
              list: {
                sx: {
                  p: 0,
                },
              },
            }}
          >
            <Box sx={{ px: 1.2, py: 0.8 }}>
              <Typography variant="overline" color="text.secondary">
                Account Books
              </Typography>
            </Box>
            {accountBooks.map((accountBook: AccountBookListResponse) => {
              const isSelected = currentAccountBook?.id === accountBook.id;

              return (
                <MenuItem
                  key={accountBook.id}
                  onClick={() => handleSelectAccountBook(accountBook)}
                  sx={{
                    minHeight: 44,
                    borderRadius: 1,
                    px: 1.2,
                    mb: 0.3,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: isSelected
                      ? alpha(theme.palette.primary.main, 0.16)
                      : "transparent",
                    "&:hover": {
                      backgroundColor: isSelected
                        ? alpha(theme.palette.primary.main, 0.22)
                        : alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <Stack spacing={0.1} sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        maxWidth: 170,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: isSelected ? 800 : 600,
                        color: "text.primary",
                      }}
                    >
                      {accountBook.name}
                    </Typography>
                  </Stack>
                  {isSelected ? (
                    <CheckRoundedIcon
                      sx={{ color: theme.palette.primary.dark, fontSize: 18 }}
                    />
                  ) : null}
                </MenuItem>
              );
            })}
          </Menu>
        </Box>

        <Divider />

        <List sx={{ px: 1, py: 1.5 }}>
          {SIDE_MENU_ITEMS.map((item) => (
            <ListItem key={item.label} disablePadding>
              {(() => {
                const isActive = location.pathname === item.path;

                return (
              <ListItemButton
                onClick={createNavigateHandler(item.path)}
                sx={{
                  minHeight: 48,
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: isActive
                    ? alpha(theme.palette.primary.main, 0.16)
                    : "transparent",
                  border: "1px solid",
                  borderColor: isActive
                    ? alpha(theme.palette.primary.main, 0.3)
                    : "transparent",
                  "&:hover": {
                    backgroundColor: isActive
                      ? alpha(theme.palette.primary.main, 0.2)
                      : alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? "primary.dark" : "text.secondary",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 800 : 700,
                    color: isActive ? "text.primary" : "text.secondary",
                  }}
                />
              </ListItemButton>
                );
              })()}
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: "auto", px: 1, pt: 1 }}>
          <Divider sx={{ mb: 1 }} />
          <ListItem disablePadding>
            <ListItemButton
              sx={{
                minHeight: 48,
                borderRadius: 2,
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.12),
                },
              }}
              onClick={() => {
                void (async () => {
                  if (window.confirm("로그아웃 하시겠습니까?")) {
                    try {
                      await LoginApi.logout();
                    } catch (error) {
                      console.error("Logout API failed", error);
                    } finally {
                      clearAccessToken();
                      resetAccountBooks();
                      void navigate("/");
                      if (!isDesktop) {
                        handleDrawerClose();
                      }
                    }
                  }
                })();
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="로그아웃"
                primaryTypographyProps={{ fontWeight: 700 }}
              />
            </ListItemButton>
          </ListItem>
        </Box>
      </Drawer>
    </Box>
  );
}

export default memo(SideBarDrawerComponent);
