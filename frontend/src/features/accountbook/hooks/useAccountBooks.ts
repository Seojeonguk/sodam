import { useEffect, useState } from "react";
import type { AccountBookListResponse } from "../services/accountbook.types";
import accountBookApi from "../services/accountBookApi";
import axios from "axios";

export const useAccountBooks = () => {
  const [accountBooks, setAccountBooks] = useState<AccountBookListResponse[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountBooks = async () => {
    try {
      const response = await accountBookApi.getAccountBooks();
      setAccountBooks(response);
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
    void fetchAccountBooks();
  }, []);

  return {
    accountBooks,
    loading,
    error,
    fetchAccountBooks,
  };
};
