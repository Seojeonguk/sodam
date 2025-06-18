import { useState, useEffect } from "react";
import transactionApi from "../services/transactionApi";
import type { TransactionListResponseDto } from "../services/transaction.types";
import axios from "axios";

export const useTransactions = () => {
  const [transactions, setTransactions] =
    useState<TransactionListResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    refetchTransactions: fetchTransactions,
  };
};
