import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Outlet />
    </Box>
  );
}

export default AuthLayout;
