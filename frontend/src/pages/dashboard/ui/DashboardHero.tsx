import { Avatar, Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AccountBalanceWallet,
  TrendingDown,
  TrendingUp,
} from "@mui/icons-material";
import { formatCurrency } from "../../../shared/lib/format";

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
  const isPositive = netBalance >= 0;

  const balanceColor = isPositive
    ? theme.palette.success.dark
    : theme.palette.error.dark;

  return (
    <Box mb={4}>
      {/* 페이지 타이틀 */}
      <Stack mb={3}>
        <Typography variant="h4" fontWeight={700}>
          대시보드
        </Typography>
        <Typography variant="body2" color="text.secondary">
          가계부 현황을 기준과 함께 살펴보세요.
        </Typography>
      </Stack>

      {/* 핵심 지표 */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr 1fr", sm: "repeat(3, 1fr)" }}
        gap={{ xs: 1.5, sm: 2 }}
      >

        {/* ── 순잔액 (모바일: 전체 폭) ── */}
        <Paper
          elevation={0}
          sx={{
            gridColumn: { xs: "1 / -1", sm: "auto" },
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2,
            border: "1px solid",
            borderColor: isPositive
              ? alpha(theme.palette.success.main, 0.4)
              : alpha(theme.palette.error.main, 0.4),
            bgcolor: isPositive
              ? alpha(theme.palette.success.main, 0.06)
              : alpha(theme.palette.error.main, 0.06),
            borderLeft: "3px solid",
            borderLeftColor: balanceColor,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: isPositive
                  ? alpha(theme.palette.success.main, 0.15)
                  : alpha(theme.palette.error.main, 0.15),
                color: balanceColor,
                width: { xs: 40, sm: 44 },
                height: { xs: 40, sm: 44 },
                flexShrink: 0,
              }}
            >
              <AccountBalanceWallet sx={{ fontSize: { xs: "1.2rem", sm: "1.4rem" } }} />
            </Avatar>
            <Box minWidth={0}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}
              >
                순잔액
              </Typography>
              <Typography
                fontWeight={800}
                sx={{
                  fontSize: { xs: "1.15rem", sm: "1.3rem" },
                  lineHeight: 1.25,
                  color: balanceColor,
                  wordBreak: "break-all",
                }}
              >
                {(isPositive ? "+" : "") + formatCurrency(netBalance)}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25 }}>
                {isPositive ? "수입이 지출보다 많아요" : "지출이 수입보다 많아요"}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* ── 총 수입 ── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            borderRadius: 2,
            border: "1px solid",
            borderColor: alpha(theme.palette.success.main, 0.35),
            bgcolor: alpha(theme.palette.success.main, 0.04),
            borderLeft: "3px solid",
            borderLeftColor: theme.palette.success.dark,
          }}
        >
          {/* 모바일: 아바타 없이 컴팩트 */}
          <Box sx={{ display: { xs: "block", sm: "none" } }}>
            <Stack direction="row" alignItems="center" spacing={0.75} mb={0.75}>
              <TrendingUp sx={{ fontSize: "1rem", color: theme.palette.success.dark }} />
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
              >
                총 수입
              </Typography>
            </Stack>
            <Typography
              fontWeight={800}
              color="success.dark"
              sx={{ fontSize: "1rem", lineHeight: 1.3, wordBreak: "break-all" }}
            >
              {formatCurrency(totalIncome)}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25 }}>
              해당 기간 합계
            </Typography>
          </Box>

          {/* 데스크톱: 아바타 포함 */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ display: { xs: "none", sm: "flex" } }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: theme.palette.success.dark,
                width: 44,
                height: 44,
                flexShrink: 0,
              }}
            >
              <TrendingUp />
            </Avatar>
            <Box minWidth={0}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}
              >
                총 수입
              </Typography>
              <Typography
                fontWeight={700}
                color="success.dark"
                sx={{ fontSize: "1.2rem", lineHeight: 1.3, wordBreak: "break-all" }}
              >
                {formatCurrency(totalIncome)}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25 }}>
                해당 기간 합계
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* ── 총 지출 ── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            borderRadius: 2,
            border: "1px solid",
            borderColor: alpha(theme.palette.error.main, 0.35),
            bgcolor: alpha(theme.palette.error.main, 0.04),
            borderLeft: "3px solid",
            borderLeftColor: theme.palette.error.dark,
          }}
        >
          {/* 모바일: 아바타 없이 컴팩트 */}
          <Box sx={{ display: { xs: "block", sm: "none" } }}>
            <Stack direction="row" alignItems="center" spacing={0.75} mb={0.75}>
              <TrendingDown sx={{ fontSize: "1rem", color: theme.palette.error.dark }} />
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
              >
                총 지출
              </Typography>
            </Stack>
            <Typography
              fontWeight={800}
              color="error.dark"
              sx={{ fontSize: "1rem", lineHeight: 1.3, wordBreak: "break-all" }}
            >
              {formatCurrency(totalExpense)}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25 }}>
              해당 기간 합계
            </Typography>
          </Box>

          {/* 데스크톱: 아바타 포함 */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ display: { xs: "none", sm: "flex" } }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.12),
                color: theme.palette.error.dark,
                width: 44,
                height: 44,
                flexShrink: 0,
              }}
            >
              <TrendingDown />
            </Avatar>
            <Box minWidth={0}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}
              >
                총 지출
              </Typography>
              <Typography
                fontWeight={700}
                color="error.dark"
                sx={{ fontSize: "1.2rem", lineHeight: 1.3, wordBreak: "break-all" }}
              >
                {formatCurrency(totalExpense)}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25 }}>
                해당 기간 합계
              </Typography>
            </Box>
          </Stack>
        </Paper>

      </Box>
    </Box>
  );
};
