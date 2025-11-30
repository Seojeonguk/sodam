import { styled, useTheme } from "@mui/material/styles";
import {
  Box,
  Drawer,
  CssBaseline,
  List,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { memo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DRAWER_WIDTH } from "../../constants/layout";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import { ExpandMore } from "@mui/icons-material";
import { useAccountBookContext } from "../../features/accountbook/context/AccountBookContext";
import type { AccountBookListResponse } from "../../features/accountbook/services/accountbook.types";

interface SideBarDrawerProps {
  openSide: boolean;
  toggleDrawer: () => void;
  handleDrawerClose: () => void;
}

const SIDE_MENU_ITEMS = [
  { label: "대시보드", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "카테고리", path: "/category", icon: <CategoryIcon /> },
  { label: "거래내역", path: "/transactions", icon: <ReceiptLongIcon /> },
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
  const isDesktop = useIsDesktop();
  const { accountBooks, currentAccountBook, setCurrentAccountBook } = useAccountBookContext();

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
        if (!isDesktop) handleDrawerClose();
      };
    },
    [navigate, isDesktop, handleDrawerClose]
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <Drawer
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
        variant={isDesktop ? "persistent" : "temporary"}
        anchor="left"
        open={openSide}
        onClose={handleDrawerClose}
      >
        <DrawerHeader>
          {/* 저장소 선택 버튼 */}
          <Box>
            <IconButton
              onClick={openRepoMenu}
              sx={{ display: "flex", alignItems: "center", borderRadius: 1 }}
            >
              <Typography
                sx={{
                  maxWidth: 130,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: "left",
                  mr: 0.5,
                }}
              >
                {currentAccountBook?.name}
              </Typography>
              <ExpandMore />
            </IconButton>
          </Box>

          {/* 저장소 메뉴 */}
          <Menu
            anchorEl={repoAnchor}
            open={Boolean(repoAnchor)}
            onClose={closeRepoMenu}
          >
            {accountBooks.map((accountbook: AccountBookListResponse) => (
              <MenuItem key={accountbook.id} onClick={() => handleSelectAccountBook(accountbook)}>
                <Typography
                  sx={{
                    maxWidth: 200,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {accountbook.name}
                </Typography>
              </MenuItem>
            ))}
          </Menu>

          {/* Drawer 닫기 */}
          <IconButton onClick={toggleDrawer}>
            {theme.direction === "ltr" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </DrawerHeader>

        <Divider />

        {/* Side 메뉴 */}
        <List>
          {SIDE_MENU_ITEMS.map((item) => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton onClick={createNavigateHandler(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />
      </Drawer>
    </Box>
  );
}

export default memo(SideBarDrawerComponent);
