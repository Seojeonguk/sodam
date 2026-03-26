import { useState, useEffect, useCallback } from "react";
import transactionApi from "../api/transactionApi";
import statApi from "../api/statApi";
import type { TransactionListResponse } from "../api/transaction.types";
import axios from "axios";
import type {
  StatPeriodRequest,
  StatPeriodResponse,
  StatRequest,
} from "../api/stat.types";
import type { PieValueType } from "@mui/x-charts/models/seriesType";
import { useAccountBookContext } from "../../accountbook/model/AccountBookContext";
import dayjs, { type Dayjs } from "dayjs";

export const useTransactions = () => {
  const [transactions, setTransactions] =
    useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentAccountBook } = useAccountBookContext();

  const [dateRange, setDateRange] = useState<{ startDate: Dayjs; endDate: Dayjs }>({
    startDate: dayjs().startOf("month"),
    endDate: dayjs().endOf("month"),
  });

  const [incomeStats, setIncomeStats] = useState<PieValueType[]>([]);
  const [expenseStats, setExpenseStats] = useState<PieValueType[]>([]);

  const [statPeriodDataset, setStatPeriodDataset] = useState<
    StatPeriodDatasetEntry[]
  >([]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const accountId = currentAccountBook?.id ?? 0;
      const startDate = dateRange.startDate.format("YYYYMMDD");
      const endDate = dateRange.endDate.format("YYYYMMDD");
      const response = await transactionApi.getTransactions(accountId, startDate, endDate);
      setTransactions(response);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [currentAccountBook, dateRange]);

  const deleteTransaction = async (seq: number) => {
    try {
      await transactionApi.deleteTransaction(seq);

      setTransactions((prev) => {
        if (prev === null) {
          return null;
        }

        return {
          ...prev,
          content: prev.transactions.filter((tx) => tx.seq !== seq),
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

  const getRandomColor = () =>
    `#${Math.floor(Math.random() * 16777215).toString(16)}`;

  const fetchStats = useCallback(async () => {
    try {
      const request: StatRequest = {
        startDate: dateRange.startDate.format("YYYYMMDD"),
        endDate: dateRange.endDate.format("YYYYMMDD"),
      };
      const response = await statApi.getStats(request);

      console.debug("전체 통계 정보 : ", response);

      const incomeStats: PieValueType[] = response
        .filter((item) => {
          return item.type === "INCOME";
        })
        .map((item, idx) => ({
          id: idx,
          value: item.total,
          label: item.name,
          color: getRandomColor(),
        }));

      console.debug("수입 통계 정보 : ", incomeStats);

      setIncomeStats(incomeStats);

      const expenseStats: PieValueType[] = response
        .filter((item) => {
          return item.type === "EXPENSE";
        })
        .map((item, idx) => ({
          id: idx,
          value: item.total,
          label: item.name,
          color: getRandomColor(),
        }));

      console.log("지출 통계 정보 : ", expenseStats);

      setExpenseStats(expenseStats);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const fetchPeriodStats = useCallback(async () => {
    try {
      const request: StatPeriodRequest = {
        startDate: dateRange.startDate.format("YYYYMMDD"),
        endDate: dateRange.endDate.format("YYYYMMDD"),
      };

      const response = await statApi.getPeriodStats(request);

      console.debug("전체 월별 통계 정보 : ", response);

      const dataset = response.reduce(
        (acc: StatPeriodDatasetEntry[], item: StatPeriodResponse) => {
          const month = item.transaction_date;
          const found = acc.find((d) => d.period === month);
          const typeKey = item.type.toLowerCase() as "income" | "expense";
          if (found) {
            found[typeKey] = item.total;
          } else {
            acc.push({
              period: month,
              income: typeKey === "income" ? item.total : 0,
              expense: typeKey === "expense" ? item.total : 0,
            });
          }
          return acc;
        },
        []
      );

      setStatPeriodDataset(dataset);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats, currentAccountBook]);

  useEffect(() => {
    void fetchPeriodStats();
  }, [fetchPeriodStats, currentAccountBook]);

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

interface StatPeriodDatasetEntry {
  [key: string]: string | number;
  period: string;
  income: number;
  expense: number;
}
