import { LinearProgress, Paper, Skeleton, Stack } from "@mui/material";

export const DashboardLoadingState = () => (
  <Stack spacing={3}>
    <LinearProgress />
    {[0, 1, 2].map((idx) => (
      <Paper key={`dashboard-skeleton-${idx}`} sx={{ p: 3, borderRadius: 3 }}>
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rectangular" height={180} sx={{ mt: 2 }} />
      </Paper>
    ))}
  </Stack>
);
