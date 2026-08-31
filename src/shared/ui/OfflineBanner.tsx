import { Box, Typography } from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";

interface OfflineBannerProps {
  pendingCount: number;
}

export function OfflineBanner({ pendingCount }: OfflineBannerProps) {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "#f59e0b",
        color: "#1c1917",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        px: 2,
        py: 0.75,
        minHeight: 36,
      }}
    >
      <WifiOffIcon sx={{ fontSize: "1rem" }} />
      <Typography variant="body2" fontWeight={600} component="span">
        오프라인 상태
      </Typography>
      {pendingCount > 0 && (
        <Typography variant="body2" component="span">
          — 대기 중인 작업 {pendingCount}건
        </Typography>
      )}
    </Box>
  );
}
