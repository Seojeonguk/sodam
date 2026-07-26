import { useCallback, useEffect, useState } from "react";
import type { PieValueType } from "@mui/x-charts/models/seriesType";
import dayjs, { type Dayjs } from "dayjs";
import transactionApi from "../api/transactionApi";
import statApi from "../api/statApi";
import type { TransactionListResponse } from "../api/transaction.types";
import type {
  StatPeriodRequest,
  StatPeriodResponse,
  StatRequest,
} from "../api/stat.types";
import { useAccountBookContext } from "../../accountbook/model/AccountBookContext";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

interface StatPeriodDatasetEntry {
  [key: string]: string | number;
  period: string;
  income: number;
  expense: number;
}

interface UseTransactionsOptions {
  /** 한 페이지에 보여줄 거래 수 (기본값: 10) */
  pageSize?: number;
}

const getRandomColor = () =>
  `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`;

const buildPieStats = (
  type: "INCOME" | "EXPENSE",
  items: Awaited<ReturnType<typeof statApi.getStats>>,
): PieValueType[] =>
  items
    .filter((item) => item.type === type)
    .map((item, index) => ({
      id: index,
      value: item.total,
      label: item.name,
      color: getRandomColor(),
    }));

const buildPeriodDataset = (
  response: StatPeriodResponse[],
): StatPeriodDatasetEntry[] =>
  response.reduce((accumulator: StatPeriodDatasetEntry[], item) => {
    const period = item.transaction_date;
    const found = accumulator.find((entry) => entry.period === period);
    const typeKey = item.type.toLowerCase() as "income" | "expense";

    if (found) {
      found[typeKey] = item.total;
      return accumulator;
    }

    accumulator.push({
      period,
      income: typeKey === "income" ? item.total : 0,
      expense: typeKey === "expense" ? item.total : 0,
    });

    return accumulator;
  }, []);

export const useTransactions = (options?: UseTransactionsOptions) => {
  const pageSize = options?.pageSize ?? 10;

  const [transactions, setTransactions] =
    useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incomeStats, setIncomeStats] = useState<PieValueType[]>([]);
  const [expenseStats, setExpenseStats] = useState<PieValueType[]>([]);
  const [statPeriodDataset, setStatPeriodDataset] = useState<
    StatPeriodDatasetEntry[]
  >([]);

  /** 0-indexed (Spring Pageable 기준) */
  const [page, setPage] = useState(0);

  const { currentAccountBook } = useAccountBookContext();
  const currentAccountBookId = currentAccountBook?.id ?? null;

  const [dateRange, setDateRange] = useState<{
    startDate: Dayjs;
    endDate: Dayjs;
  }>({
    startDate: dayjs().startOf("month"),
    endDate: dayjs().endOf("month"),
  });

  /** 카테고리 필터 (null = 전체) */
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  /** dateRange / categoryFilter가 바뀌면 첫 페이지로 리셋 */
  useEffect(() => {
    setPage(0);
  }, [dateRange.startDate, dateRange.endDate, categoryFilter]);

  const resetTransactionState = useCallback(() => {
    setTransactions(null);
    setIncomeStats([]);
    setExpenseStats([]);
    setStatPeriodDataset([]);
    setError(null);
    setLoading(false);
  }, []);

  const refreshTransactionData = useCallback(async () => {
    if (!currentAccountBookId) {
      resetTransactionState();
      return;
    }

    setLoading(true);
    setError(null);

    const startDate = dateRange.startDate.format("YYYYMMDD");
    const endDate = dateRange.endDate.format("YYYYMMDD");

    const statRequest: StatRequest = { startDate, endDate };
    const statPeriodRequest: StatPeriodRequest = { startDate, endDate };

    try {
      const [nextTransactions, nextStats, nextPeriodStats] = await Promise.all([
        transactionApi.getTransactions(
          currentAccountBookId,
          startDate,
          endDate,
          page,
          pageSize,
          categoryFilter ?? undefined,
        ),
        statApi.getStats(statRequest),
        statApi.getPeriodStats(statPeriodRequest),
      ]);

      setTransactions(nextTransactions);
      setIncomeStats(buildPieStats("INCOME", nextStats));
      setExpenseStats(buildPieStats("EXPENSE", nextStats));
      setStatPeriodDataset(buildPeriodDataset(nextPeriodStats));
    } catch (nextError) {
      setError(
        getServerErrorMessage(
          nextError,
          "거래 및 통계 데이터를 불러오는 중 오류가 발생했습니다.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentAccountBookId,
    dateRange.endDate,
    dateRange.startDate,
    page,
    pageSize,
    categoryFilter,
    resetTransactionState,
  ]);

  const deleteTransaction = useCallback(
    async (seq: number) => {
      try {
        await transactionApi.deleteTransaction(seq);
        await refreshTransactionData();
      } catch (nextError) {
        throw new Error(
          getServerErrorMessage(nextError, "거래 삭제 중 오류가 발생했습니다."),
        );
      }
    },
    [refreshTransactionData],
  );

  useEffect(() => {
    void refreshTransactionData();
  }, [refreshTransactionData]);

  // FAB(쉘 레벨)에서 거래 추가 시 자동 새로고침
  useEffect(() => {
    const handler = () => { void refreshTransactionData(); };
    window.addEventListener("sodam:transaction-added", handler);
    return () => window.removeEventListener("sodam:transaction-added", handler);
  }, [refreshTransactionData]);

  return {
    transactions,
    loading,
    error,
    refreshTransactionData,
    deleteTransaction,
    incomeStats,
    expenseStats,
    statPeriodDataset,
    dateRange,
    setDateRange,
    /** 카테고리 필터 (null = 전체) */
    categoryFilter,
    setCategoryFilter,
    /** 현재 페이지 (0-indexed) */
    page,
    /** 페이지 변경 핸들러 (0-indexed) */
    setPage,
    /** 전체 페이지 수 */
    totalPages: transactions?.totalPages ?? 1,
    /** 전체 거래 건수 */
    totalElements: transactions?.totalElements ?? 0,
  };
};
