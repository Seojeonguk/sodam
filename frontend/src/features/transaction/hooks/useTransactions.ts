import { useState, useEffect } from "react";
import transactionApi from "../services/transactionApi";
import statApi from "../services/statApi";
import type { TransactionListResponse } from "../services/transaction.types";
import axios from "axios";
import type { StatResponse } from "../services/stat.types";
import type { StatRequest } from "./../services/stat.types";
import type { PieValueType } from "@mui/x-charts/models/seriesType";

export const useTransactions = () => {
  const [transactions, setTransactions] =
    useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incomeStats, setIncomeStats] = useState<PieValueType[]>([]);
  const [expenseStats, setExpenseStats] = useState<PieValueType[]>([]);
  const [statReq, setStatReq] = useState<StatRequest>({});

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await transactionApi.getTransactions();
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
  };

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

  const fetchStats = async () => {
    try {
      const response = await statApi.getStats(statReq);

      console.debug('전체 통계 정보 : ', response);

      const incomeStats:PieValueType[] = response.filter((item)=> {
        return item.type === 'INCOME'
      })
      .map((item, idx)=> ({
        id : idx,
        value : item.total,
        label: item.name,
        color : getRandomColor()
      }));

      console.debug('수입 통계 정보 : ', incomeStats);

      setIncomeStats(incomeStats);

      const expenseStats:PieValueType[] = response.filter((item)=> {
        return item.type === 'EXPENSE'
      })
      .map((item, idx)=> ({
        id : idx,
        value : item.total,
        label: item.name,
        color : getRandomColor()
      }));

      console.log('지출 통계 정보 : ', expenseStats);

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
  };

  useEffect(() => {
    void fetchTransactions();
  }, []);

  useEffect(() => {
    void fetchStats();
  }, []);

  return {
    transactions,
    loading,
    error,
    refetchTransactions: fetchTransactions,
    deleteTransaction,
    incomeStats,
    expenseStats,
    fetchStats
  };
};
