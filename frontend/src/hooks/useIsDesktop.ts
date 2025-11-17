import { useMediaQuery, useTheme } from "@mui/material";

export const useIsDesktop = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up("sm"));
};
