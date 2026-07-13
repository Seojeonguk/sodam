import { useCallback, useEffect, useState } from "react";
import type { AccountBookListResponse } from "../api/accountbook.types";
import accountBookApi from "../api/accountBookApi";
import { guestMode } from "../../../shared/lib/guestMode";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

export const useAccountBooks = () => {
  const [accountBooks, setAccountBooks] = useState<AccountBookListResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountBooks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await accountBookApi.getAccountBooks();
      setAccountBooks(response);
    } catch (nextError) {
      setError(
        getServerErrorMessage(
          nextError,
          "가계부를 불러오는 중 오류가 발생했습니다.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // 게스트 모드로 페이지 새로고침 시 자동 fetch
  useEffect(() => {
    if (guestMode.isActive()) {
      void fetchAccountBooks();
    }
  }, [fetchAccountBooks]);

  const resetAccountBooks = useCallback(() => {
    setAccountBooks([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    accountBooks,
    loading,
    error,
    fetchAccountBooks,
    resetAccountBooks,
  };
};
