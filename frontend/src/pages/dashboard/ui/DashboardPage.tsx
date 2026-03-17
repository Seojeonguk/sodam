import { Box, Container, Stack } from "@mui/material";
import {
  Category as CategoryIcon,
  Insights,
  ReceiptLong,
} from "@mui/icons-material";
import { useMemo } from "react";
import { useTransactions } from "../../../entities/transaction/model/useTransactions";
import { useCategories } from "../../../entities/category/model/useCategories";
import { DashboardHero } from "./components/DashboardHero";
import { SummaryCards } from "./components/SummaryCards";
import { MonthlyTrendSection } from "./components/MonthlyTrendSection";
import { TypeBreakdownSection } from "./components/TypeBreakdownSection";
import { RecentTransactionsSection } from "./components/RecentTransactionsSection";
import { HighlightedCategoriesSection } from "./components/HighlightedCategoriesSection";
import { DashboardLoadingState } from "./components/DashboardLoadingState";
import { DashboardErrorState } from "./components/DashboardErrorState";

function DashboardPage() {
  const {
    transactions,
    loading: txLoading,
    error: txError,
    incomeStats,
    expenseStats,
    statPeriodDataset,
  } = useTransactions();
  const {
    categories,
    loading: categoryLoading,
    error: categoryError,
  } = useCategories();

  const isLoading = txLoading || categoryLoading;
  const error = txError ?? categoryError;

  const totalTransactions = transactions?.transactions.length ?? 0;
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
    () => transactions?.transactions.slice(0, 5) ?? [],
    [transactions],
  );

  const highlightedCategories = useMemo(
    () => (categories?.categories ?? []).slice(0, 6),
    [categories],
  );

  const summaryCards = [
    {
      title: "총 거래 건수",
      subtitle: "최근 수집된 데이터",
      value: `${totalTransactions}건`,
      icon: <ReceiptLong />,
      accent: "#0288d1",
    },
    {
      title: "카테고리",
      subtitle: "사용 중인 카테고리",
      value: `${categories?.categories.length ?? 0}개`,
      icon: <CategoryIcon />,
      accent: "#ab47bc",
    },
    {
      title: "월별 업데이트",
      subtitle: "통계 데이터 포인트",
      value: `${statPeriodDataset.length}개월`,
      icon: <Insights />,
      accent: "#2e7d32",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <DashboardHero
        netBalance={netBalance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      {isLoading && <DashboardLoadingState />}

      {!isLoading && error && <DashboardErrorState message={error} />}

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
