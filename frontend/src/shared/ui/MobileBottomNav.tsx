import { Add, Dashboard, Menu, Receipt, SavingsOutlined } from "@mui/icons-material";
import { Box, Fab, Paper, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";

// null = FAB 자리 (가운데)
type NavItem =
  | { label: string; Icon: React.ElementType; path: string; action?: undefined }
  | { label: string; Icon: React.ElementType; path?: undefined; action: "menu" }
  | null;

const NAV_ITEMS: NavItem[] = [
  { label: "홈", Icon: Dashboard, path: "/dashboard" },
  { label: "거래", Icon: Receipt, path: "/transactions" },
  null, // ← FAB (정중앙 3/5)
  { label: "예산", Icon: SavingsOutlined, path: "/budget" },
  { label: "설정", Icon: Menu, action: "menu" },
];

interface MobileBottomNavProps {
  onAddClick: () => void;
  onMenuClick: () => void;
}

export function MobileBottomNav({ onAddClick, onMenuClick }: MobileBottomNavProps) {
  const theme = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        display: { xs: "flex", md: "none" },
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        height: 60,
        alignItems: "stretch",
      }}
    >
      {NAV_ITEMS.map((item, idx) => {
        if (item === null) {
          // 가운데 FAB 자리 — 동등한 flex:1 영역 안에 FAB 띄움
          return (
            <Box
              key="fab-slot"
              sx={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Fab
                color="primary"
                size="medium"
                onClick={onAddClick}
                aria-label="거래 추가"
                sx={{
                  position: "absolute",
                  top: -20,
                  width: 52,
                  height: 52,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}
              >
                <Add />
              </Fab>
            </Box>
          );
        }

        const isActive =
          item.path !== undefined && pathname === item.path;

        const handleClick = () => {
          if (item.action === "menu") {
            onMenuClick();
          } else if (item.path) {
            navigate(item.path);
          }
        };

        return (
          <Box
            key={idx}
            onClick={handleClick}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.3,
              cursor: "pointer",
              pt: 0.5,
              color: isActive ? "primary.main" : "text.secondary",
              transition: "color 0.15s ease",
              "&:active": { opacity: 0.6 },
            }}
          >
            <item.Icon
              sx={{
                fontSize: "1.25rem",
                color: isActive ? "primary.main" : "action.active",
              }}
            />
            <Typography
              sx={{
                fontSize: "0.58rem",
                fontWeight: isActive ? 700 : 400,
                lineHeight: 1,
                color: "inherit",
              }}
            >
              {item.label}
            </Typography>
          </Box>
        );
      })}
    </Paper>
  );
}
