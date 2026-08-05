import { memo, useCallback, useState, lazy, Suspense } from "react";
import { styled, useTheme, alpha } from "@mui/material/styles";
import {
  Box,
  CircularProgress,
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
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const MemberManageModal = lazy(() => import("../../../features/member/ui/MemberManageModal"));
const AccountBookCreateModal = lazy(() => import("../../../features/accountbook/ui/AccountBookCreateModal"));
import { useLocation, useNavigate } from "react-router-dom";
import { DRAWER_WIDTH } from "../../../shared/config/layout";
import { useIsDesktop } from "../../../shared/lib/useIsDesktop";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
import type { AccountBookListResponse } from "../../../entities/accountbook/api/accountbook.types";
import { clearAccessToken } from "../../../shared/api/api";
import { supabase } from "../../../shared/lib/supabase";
import { clearUserSeq, ensureDefaultData, getUserSeq } from "../../../shared/lib/userSync";
import { guestMode } from "../../../shared/lib/guestMode";

interface SideBarDrawerProps {
  openSide: boolean;
  toggleDrawer: () => void;
  handleDrawerClose: () => void;
}

const SIDE_MENU_ITEMS = [
  { label: "대시보드", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "거래 내역", path: "/transactions", icon: <ReceiptLongIcon /> },
  { label: "예산 관리", path: "/budget", icon: <SavingsOutlinedIcon /> },
  { label: "반복 거래", path: "/recurring", icon: <RepeatOutlinedIcon /> },
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
  const { accountBooks, currentAccountBook, setCurrentAccountBook, resetAccountBooks, fetchAccountBooks } =
    useAccountBookContext();
  const [repoAnchor, setRepoAnchor] = useState<HTMLElement | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [createBookModalOpen, setCreateBookModalOpen] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [initResult, setInitResult] = useState<"success" | "error" | null>(null);

  const handleInitDefaultData = async () => {
    if (initLoading) return;
    setInitLoading(true);
    setInitResult(null);
    try {
      const userSeq = await getUserSeq();
      await ensureDefaultData(userSeq);
      await fetchAccountBooks();
      setInitResult("success");
    } catch (err) {
      console.error("기본 데이터 초기화 실패", err);
      setInitResult("error");
    } finally {
      setInitLoading(false);
      // 3초 후 결과 메시지 초기화
      setTimeout(() => setInitResult(null), 3000);
    }
  };

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
            {/* 새 가계부 만들기 */}
            {!guestMode.isActive() && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem
                  onClick={() => {
                    closeRepoMenu();
                    setCreateBookModalOpen(true);
                  }}
                  sx={{
                    minHeight: 44,
                    borderRadius: 1,
                    px: 1.2,
                    color: "primary.main",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <AddIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography fontWeight={700} variant="body2">새 가계부 만들기</Typography>
                </MenuItem>
              </>
            )}
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

          {/* 멤버 관리 — OWNER 전용, 게스트 모드 제외 */}
          {!guestMode.isActive() && currentAccountBook?.isOwner ? (
            <ListItem disablePadding>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  borderRadius: 2,
                  mb: 0.5,
                  color: "text.secondary",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
                onClick={() => setMemberModalOpen(true)}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                  <GroupsOutlinedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="멤버 관리"
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
              </ListItemButton>
            </ListItem>
          ) : null}

          {/* 기본 데이터 초기화 — 비게스트 전용 */}
          {!guestMode.isActive() && (
            <ListItem disablePadding>
              <Tooltip
                title={
                  initResult === "success"
                    ? "초기화 완료!"
                    : initResult === "error"
                      ? "초기화 실패. 다시 시도해 주세요."
                      : "가계부·분류 기본 데이터가 없을 때 복구합니다"
                }
                placement="right"
              >
                <ListItemButton
                  disabled={initLoading}
                  onClick={() => void handleInitDefaultData()}
                  sx={{
                    minHeight: 48,
                    borderRadius: 2,
                    mb: 0.5,
                    color:
                      initResult === "success"
                        ? "success.main"
                        : initResult === "error"
                          ? "error.main"
                          : "text.secondary",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.warning.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color:
                        initResult === "success"
                          ? "success.main"
                          : initResult === "error"
                            ? "error.main"
                            : "text.secondary",
                    }}
                  >
                    {initLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <RestartAltIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      initLoading
                        ? "초기화 중..."
                        : initResult === "success"
                          ? "초기화 완료!"
                          : initResult === "error"
                            ? "초기화 실패"
                            : "기본 데이터 초기화"
                    }
                    primaryTypographyProps={{ fontWeight: 700 }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )}

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
                      await supabase.auth.signOut();
                    } catch (error) {
                      console.error("Logout failed", error);
                    } finally {
                      clearAccessToken();
                      clearUserSeq();
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

      {/* 멤버 관리 모달 */}
      {currentAccountBook && memberModalOpen && (
        <Suspense fallback={null}>
          <MemberManageModal
            open={memberModalOpen}
            onClose={() => setMemberModalOpen(false)}
            accountBookId={currentAccountBook.id}
            accountBookName={currentAccountBook.name}
          />
        </Suspense>
      )}

      {/* 가계부 생성 모달 */}
      <Suspense fallback={null}>
        <AccountBookCreateModal
          open={createBookModalOpen}
          onClose={() => setCreateBookModalOpen(false)}
          onSuccess={fetchAccountBooks}
        />
      </Suspense>
    </Box>
  );
}

export default memo(SideBarDrawerComponent);
