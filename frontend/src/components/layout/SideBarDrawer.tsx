import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";

import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mui/material";

const drawerWidth = 240;

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

export default function SideBarDrawer({
  openSide,
  toggleDrawer,
  handleDrawerClose,
}: SideBarDrawerProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  const isDesktop = useMediaQuery(theme.breakpoints.up("sm")); // sm 이상이면 데스크탑

  const sideMenuList = [
    {
      label: "카테고리",
      func: async () => {
        await navigate("/category");
      },
    },
    {
      label: "거래내역",
      func: async () => {
        await navigate("/transactions");
      },
    },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
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
          {sideMenuList.map((item, index) => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton onClick={item.func}>
                <ListItemIcon>
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
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
