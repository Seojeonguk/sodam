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
  const [stats, setStats] = useState<PieValueType[]>([]);
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

  const fetchStats = async () => {
    try {
      const response = await statApi.getStats(statReq);

      const stat:PieValueType[] = response.map((item, idx)=> ({
        id : idx,
        value : item.total,
        label: item.name
      }));

      setStats(stat);

      console.log('통계 결과 : ', stat);
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
    stats
  };
};
