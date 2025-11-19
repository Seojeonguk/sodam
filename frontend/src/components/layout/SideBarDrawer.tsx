import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useNavigate } from "react-router-dom";
import { memo, useCallback } from "react";
import { DRAWER_WIDTH } from "../../constants/layout";
import { useIsDesktop } from "../../hooks/useIsDesktop";

const SIDE_MENU_ITEMS = [
  { label: "대시보드", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "카테고리", path: "/category", icon: <CategoryIcon /> },
  { label: "거래내역", path: "/transactions", icon: <ReceiptLongIcon /> },
];

interface SideBarDrawerProps {
  openSide: boolean;
  toggleDrawer: () => void;
  handleDrawerClose: () => void;
}

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

function SideBarDrawerComponent({
  openSide,
  toggleDrawer,
  handleDrawerClose,
}: SideBarDrawerProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop(); // sm 이상이면 데스크탑

  const createNavigateHandler = useCallback(
    (path: string) => () => {
      void navigate(path);
      if (!isDesktop) {
        handleDrawerClose();
      }
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
          <IconButton onClick={toggleDrawer}>
            {theme.direction === "ltr" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {SIDE_MENU_ITEMS.map((item) => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton onClick={createNavigateHandler(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  sx={{ overflowWrap: "break-word" }}
                  primary={item.label}
                />
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
