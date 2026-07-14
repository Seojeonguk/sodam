import {
  Box,
  Container,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  Category as CategoryIcon,
  Insights,
  ReceiptLong,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useTransactions } from "../../../entities/transaction/model/useTransactions";
import { useCategories } from "../../../entities/category/model/useCategories";
import { DashboardHero } from "./DashboardHero";
import { SummaryCards } from "./SummaryCards";
import { MonthlyTrendSection } from "./MonthlyTrendSection";
import { TypeBreakdownSection } from "./TypeBreakdownSection";
import { RecentTransactionsSection } from "./RecentTransactionsSection";
import { HighlightedCategoriesSection } from "./HighlightedCategoriesSection";
import { DashboardLoadingState } from "./DashboardLoadingState";
import { DashboardErrorState } from "./DashboardErrorState";

type PeriodMode = "month" | "year";

function DashboardPage() {
  const now = dayjs();
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [selectedYear, setSelectedYear] = useState<number>(now.year());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.month() + 1);

  const {
    transactions,
    loading: txLoading,
    error: txError,
    incomeStats,
    expenseStats,
    statPeriodDataset,
    dateRange,
    setDateRange,
    refreshTransactionData,
    totalElements,
  } = useTransactions({ pageSize: 5 });
  const {
    categories,
    loading: categoryLoading,
    error: categoryError,
  } = useCategories();

  useEffect(() => {
    if (periodMode === "year") {
      setDateRange({
        startDate: dayjs(`${selectedYear}-01-01`).startOf("year"),
        endDate: dayjs(`${selectedYear}-12-31`).endOf("year"),
      });
      return;
    }

    setDateRange({
      startDate: dayjs(
        `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`,
      ).startOf("month"),
      endDate: dayjs(
        `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`,
      ).endOf("month"),
    });
  }, [periodMode, selectedMonth, selectedYear, setDateRange]);

  const isLoading = txLoading || categoryLoading;
  const error = txError ?? categoryError;

  const allTransactions = useMemo(
    () => transactions?.transactions ?? [],
    [transactions],
  );
  /* 현재 페이지 건수가 아닌 전체 건수 사용 */
  const totalTransactions = totalElements;

  const totalIncome = useMemo(
    () =>
      incomeStats.reduce(
        (sum, stat) => sum + (typeof stat.value === "number" ? stat.value : 0),
        0,
      ),
    [incomeStats],
  );

  const totalExpense = useMemo(
    () =>
      expenseStats.reduce(
        (sum, stat) => sum + (typeof stat.value === "number" ? stat.value : 0),
        0,
      ),
    [expenseStats],
  );

  const netBalance = totalIncome - totalExpense;

  const recentTransactions = useMemo(
    () => allTransactions.slice(0, 5),
    [allTransactions],
  );

  const highlightedCategories = useMemo(() => {
    const categoryUsage = new Map<string, number>();

    allTransactions.forEach((transaction) => {
      if (!transaction.categoryName) {
        return;
      }

      categoryUsage.set(
        transaction.categoryName,
        (categoryUsage.get(transaction.categoryName) ?? 0) + 1,
      );
    });

    return (categories?.categories ?? [])
      .map((category) => ({
        ...category,
        usageCount: categoryUsage.get(category.name) ?? 0,
      }))
      .sort(
        (a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name),
      )
      .slice(0, 6);
  }, [allTransactions, categories]);

  const datasetMonths = statPeriodDataset.length;
  const appliedPeriodLabel =
    periodMode === "year"
      ? `${selectedYear}년 전체`
      : `${selectedYear}년 ${selectedMonth}월`;

  const standards = [
    `기간 기준: ${appliedPeriodLabel}`,
    `거래 집계: 현재 범위 내 전체 거래 ${totalTransactions}건`,
    `카테고리 기준: 거래 사용 순 상위 ${highlightedCategories.length}개`,
  ];

  const summaryCards = [
    {
      title: "전체 거래 건수",
      subtitle: `기준: ${appliedPeriodLabel} 거래 전체`,
      value: `${totalTransactions}건`,
      icon: <ReceiptLong />,
      accent: "#0288d1",
    },
    {
      title: "활성 카테고리",
      subtitle: "기준: 현재 가계부에 등록된 카테고리",
      value: `${categories?.categories.length ?? 0}개`,
      icon: <CategoryIcon />,
      accent: "#ab47bc",
    },
    {
      title: "통계 반영 개월 수",
      subtitle: `기준: ${appliedPeriodLabel} 안에서 집계된 월 수`,
      value: `${datasetMonths}개월`,
      icon: <Insights />,
      accent: "#2e7d32",
    },
  ];

  const yearOptions = useMemo(() => {
    const currentYear = now.year();
    return Array.from({ length: 6 }, (_, index) => currentYear - 4 + index);
  }, [now]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <DashboardHero
        netBalance={netBalance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        standards={standards}
      />

      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              대시보드 기준 기간
            </Typography>
            <Typography variant="body2" color="text.secondary">
              월 단위 또는 연도 단위로 집계 기준을 직접 선택할 수 있습니다.
            </Typography>
          </Box>

          {/* 기간 컨트롤: 항상 한 줄 (토글 + 연도 + 월) */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            rowGap={1}
          >
            <ToggleButtonGroup
              exclusive
              size="small"
              value={periodMode}
              onChange={(_, value: PeriodMode | null) => {
                if (value) {
                  setPeriodMode(value);
                }
              }}
            >
              <ToggleButton value="month" sx={{ px: 1.5, fontSize: "0.8rem" }}>
                월
              </ToggleButton>
              <ToggleButton value="year" sx={{ px: 1.5, fontSize: "0.8rem" }}>
                연도
              </ToggleButton>
            </ToggleButtonGroup>

            <FormControl size="small" sx={{ minWidth: 90 }}>
              <Select
                value={selectedYear}
                onChange={(event) =>
                  setSelectedYear(Number(event.target.value))
                }
              >
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}년
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {periodMode === "month" ? (
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={selectedMonth}
                  onChange={(event) =>
                    setSelectedMonth(Number(event.target.value))
                  }
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(
                    (month) => (
                      <MenuItem key={month} value={month}>
                        {month}월
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>
            ) : null}
          </Stack>
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1.5, display: "block" }}
        >
          현재 적용 범위: {dateRange.startDate.format("YYYY.MM.DD")} -{" "}
          {dateRange.endDate.format("YYYY.MM.DD")}
        </Typography>
      </Paper>

      {isLoading && <DashboardLoadingState />}

      {!isLoading && error && (
        <DashboardErrorState
          message={error}
          onRetry={() => {
            void refreshTransactionData();
          }}
        />
      )}

      {!isLoading && !error && (
        <Stack spacing={3}>
          <SummaryCards cards={summaryCards} />

          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "1.1fr 0.9fr" }}
            gap={3}
          >
            <MonthlyTrendSection dataset={statPeriodDataset} />
            <TypeBreakdownSection
              totalIncome={totalIncome}
              totalExpense={totalExpense}
            />
          </Box>

          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "1.1fr 0.9fr" }}
            gap={3}
          >
            <RecentTransactionsSection transactions={recentTransactions} />
            <HighlightedCategoriesSection categories={highlightedCategories} />
          </Box>
        </Stack>
      )}
    </Container>
  );
}

export default DashboardPage;
