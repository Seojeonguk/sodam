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

const getRandomColor = () =>
  `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;

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

export const useTransactions = () => {
  const [transactions, setTransactions] =
    useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incomeStats, setIncomeStats] = useState<PieValueType[]>([]);
  const [expenseStats, setExpenseStats] = useState<PieValueType[]>([]);
  const [statPeriodDataset, setStatPeriodDataset] = useState<
    StatPeriodDatasetEntry[]
  >([]);

  const { currentAccountBook } = useAccountBookContext();
  const currentAccountBookId = currentAccountBook?.id ?? null;

  const [dateRange, setDateRange] = useState<{ startDate: Dayjs; endDate: Dayjs }>(
    {
      startDate: dayjs().startOf("month"),
      endDate: dayjs().endOf("month"),
    },
  );

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
        transactionApi.getTransactions(currentAccountBookId, startDate, endDate),
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
  }, [currentAccountBookId, dateRange.endDate, dateRange.startDate, resetTransactionState]);

  const deleteTransaction = useCallback(
    async (seq: number) => {
      try {
        await transactionApi.deleteTransaction(seq);
        await refreshTransactionData();
      } catch (nextError) {
        throw new Error(
          getServerErrorMessage(
            nextError,
            "거래 삭제 중 오류가 발생했습니다.",
          ),
        );
      }
    },
    [refreshTransactionData],
  );

  useEffect(() => {
    void refreshTransactionData();
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
  };
};
