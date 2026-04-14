import { useCallback, useEffect, useState } from "react";
import type { PieValueType } from "@mui/x-charts/models/seriesType";
import axios from "axios";
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

interface StatPeriodDatasetEntry {
  [key: string]: string | number;
  period: string;
  income: number;
  expense: number;
}

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

  const getRandomColor = () =>
    `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;

  const fetchTransactions = useCallback(async () => {
    if (!currentAccountBookId) {
      setTransactions(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startDate = dateRange.startDate.format("YYYYMMDD");
      const endDate = dateRange.endDate.format("YYYYMMDD");
      const response = await transactionApi.getTransactions(
        currentAccountBookId,
        startDate,
        endDate,
      );

      setTransactions(response);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError("거래 내역을 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [currentAccountBookId, dateRange]);

  const fetchStats = useCallback(async () => {
    if (!currentAccountBookId) {
      setIncomeStats([]);
      setExpenseStats([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: StatRequest = {
        startDate: dateRange.startDate.format("YYYYMMDD"),
        endDate: dateRange.endDate.format("YYYYMMDD"),
      };
      const response = await statApi.getStats(request);

      const nextIncomeStats: PieValueType[] = response
        .filter((item) => item.type === "INCOME")
        .map((item, idx) => ({
          id: idx,
          value: item.total,
          label: item.name,
          color: getRandomColor(),
        }));

      const nextExpenseStats: PieValueType[] = response
        .filter((item) => item.type === "EXPENSE")
        .map((item, idx) => ({
          id: idx,
          value: item.total,
          label: item.name,
          color: getRandomColor(),
        }));

      setIncomeStats(nextIncomeStats);
      setExpenseStats(nextExpenseStats);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError("통계를 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [currentAccountBookId, dateRange]);

  const fetchPeriodStats = useCallback(async () => {
    if (!currentAccountBookId) {
      setStatPeriodDataset([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: StatPeriodRequest = {
        startDate: dateRange.startDate.format("YYYYMMDD"),
        endDate: dateRange.endDate.format("YYYYMMDD"),
      };
      const response = await statApi.getPeriodStats(request);

      const dataset = response.reduce(
        (acc: StatPeriodDatasetEntry[], item: StatPeriodResponse) => {
          const period = item.transaction_date;
          const found = acc.find((entry) => entry.period === period);
          const typeKey = item.type.toLowerCase() as "income" | "expense";

          if (found) {
            found[typeKey] = item.total;
            return acc;
          }

          acc.push({
            period,
            income: typeKey === "income" ? item.total : 0,
            expense: typeKey === "expense" ? item.total : 0,
          });

          return acc;
        },
        [],
      );

      setStatPeriodDataset(dataset);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError("기간별 통계를 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [currentAccountBookId, dateRange]);

  const deleteTransaction = async (seq: number) => {
    try {
      await transactionApi.deleteTransaction(seq);

      setTransactions((prev) => {
        if (prev === null) {
          return null;
        }

        return {
          ...prev,
          transactions: prev.transactions.filter((tx) => tx.seq !== seq),
        };
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(`삭제 실패: ${err.message}`);
      } else {
        alert("거래 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    void fetchPeriodStats();
  }, [fetchPeriodStats]);

  return {
    transactions,
    loading,
    error,
    refetchTransactions: fetchTransactions,
    deleteTransaction,
    incomeStats,
    expenseStats,
    fetchStats,
    fetchPeriodStats,
    statPeriodDataset,
    dateRange,
    setDateRange,
  };
};
