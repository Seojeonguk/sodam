import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { formatCompactCurrency, formatCurrency } from "../../../shared/lib/format";

interface DashboardHeroProps {
  netBalance: number;
  totalIncome: number;
  totalExpense: number;
  standards: string[];
}

export const DashboardHero = ({
  netBalance,
  totalIncome,
  totalExpense,
  standards,
}: DashboardHeroProps) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        mb: 4,
        borderRadius: 3,
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
            DASHBOARD OVERVIEW
          </Typography>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            mb={1}
            sx={{ fontSize: { xs: "1.25rem", md: "2rem" } }}
          >
            이번 가계부 현황을 기준과 함께 살펴보세요
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 680,
              opacity: 0.92,
              fontSize: { xs: "0.85rem", md: "1rem" },
            }}
          >
            숫자만 보여주는 대신, 각 카드와 차트가 어떤 기준으로 집계됐는지
            같이 확인할 수 있도록 정리했습니다.
          </Typography>
        </Box>

        {/* 잔액 행 */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 1.5, md: 2 }}
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          {/* 순잔액 숫자 + 레이블 */}
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Typography
              component="span"
              fontWeight={700}
              sx={{
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                lineHeight: 1.15,
                wordBreak: "break-all",
              }}
            >
              {formatCurrency(Math.abs(netBalance))}
            </Typography>
            <Box>
              <Typography variant="subtitle2">
                {netBalance >= 0 ? "순이익 기준" : "순지출 기준"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.84 }}>
                수입 합계 대비 지출 합계
              </Typography>
            </Box>
          </Stack>

          <Box flexGrow={1} />

          {/* 수입 / 지출 chip */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
            <Chip
              icon={<ArrowUpward sx={{ fontSize: "1rem !important" }} />}
              label={`수입 ${formatCompactCurrency(totalIncome)}`}
              size="small"
              sx={{
                color: "common.white",
                borderColor: alpha("#fff", 0.4),
                borderWidth: 1,
                borderStyle: "solid",
                backgroundColor: alpha("#fff", 0.08),
                maxWidth: 200,
              }}
            />
            <Chip
              icon={<ArrowDownward sx={{ fontSize: "1rem !important" }} />}
              label={`지출 ${formatCompactCurrency(totalExpense)}`}
              size="small"
              sx={{
                color: "common.white",
                borderColor: alpha("#fff", 0.4),
                borderWidth: 1,
                borderStyle: "solid",
                backgroundColor: alpha("#fff", 0.08),
                maxWidth: 200,
              }}
            />
          </Stack>
        </Stack>

        {/* 집계 기준 chip 목록 */}
        <Box>
          <Typography
            variant="caption"
            sx={{ display: "block", opacity: 0.84, mb: 1.2 }}
          >
            집계 기준
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
            {standards.map((standard) => (
              <Chip
                key={standard}
                label={standard}
                size="small"
                sx={{
                  color: "common.white",
                  borderColor: alpha("#fff", 0.3),
                  borderWidth: 1,
                  borderStyle: "solid",
                  backgroundColor: alpha("#fff", 0.1),
                  height: "auto",
                  "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 },
                }}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};
