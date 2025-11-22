import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { formatCurrency } from "../utils/format";

interface DashboardHeroProps {
  netBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export const DashboardHero = ({
  netBalance,
  totalIncome,
  totalExpense,
}: DashboardHeroProps) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        mb: 4,
        borderRadius: 4,
        color: "common.white",
        position: "relative",
        overflow: "hidden",
        backgroundImage: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.95,
        )} 0%, ${alpha(theme.palette.primary.dark, 0.92)} 60%, ${alpha(
          theme.palette.secondary.main,
          0.9,
        )} 100%)`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -80,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          backgroundColor: alpha("#fff", 0.15),
          filter: "blur(8px)",
        }}
      />
      <Stack spacing={3} position="relative">
        <Box>
          <Typography variant="overline" sx={{ letterSpacing: 2 }}>
            FINANCE DASHBOARD
          </Typography>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            mb={1}
            sx={{ fontSize: { xs: "1rem", md: "2rem" } }}
          >
            💡 한눈에 보는 지출 & 수입 흐름
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 640,
              opacity: 0.9,
              fontSize: { xs: "0.8rem", md: "1rem" },
            }}
          >
            최근 거래, 카테고리, 월별 추이를 묶어 재무 흐름을 빠르게 파악하세요.
            주요 지표를 기반으로 오늘의 결정을 뒷받침해 드립니다.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h3" component="span" fontWeight={700}>
              {formatCurrency(Math.abs(netBalance))}
            </Typography>
            <Box>
              <Typography variant="subtitle2">
                {netBalance >= 0 ? "순이익" : "순지출"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                수입 대비 지출
              </Typography>
            </Box>
          </Stack>
          <Box flexGrow={1} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<ArrowUpward />}
              label={`수입 ${formatCurrency(totalIncome)}`}
              sx={{
                color: "common.white",
                borderColor: alpha("#fff", 0.4),
                borderWidth: 1,
                borderStyle: "solid",
                backgroundColor: alpha("#fff", 0.08),
              }}
            />
            <Chip
              icon={<ArrowDownward />}
              label={`지출 ${formatCurrency(totalExpense)}`}
              sx={{
                color: "common.white",
                borderColor: alpha("#fff", 0.4),
                borderWidth: 1,
                borderStyle: "solid",
                backgroundColor: alpha("#fff", 0.08),
              }}
            />
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};
