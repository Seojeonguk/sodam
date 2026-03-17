import { Paper, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

interface DashboardErrorStateProps {
  message: string;
}

export const DashboardErrorState = ({ message }: DashboardErrorStateProps) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
      }}
    >
      <Typography variant="h6" color="error" gutterBottom>
        데이터 로딩 실패
      </Typography>
      <Typography color="text.secondary">{message}</Typography>
    </Paper>
  );
};
