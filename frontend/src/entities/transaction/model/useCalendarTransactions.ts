import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import transactionApi from "../api/transactionApi";
import type { TransactionListItemResponse } from "../api/transaction.types";
import { useAccountBookContext } from "../../accountbook/model/AccountBookContext";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

export interface CalendarDayData {
  income: number;
  expense: number;
  transactions: TransactionListItemResponse[];
}

interface UseCalendarTransactionsOptions {
  categorySeqs?: number[];
}

export const useCalendarTransactions = (options?: UseCalendarTransactionsOptions) => {
  const [month, setMonth] = useState<Dayjs>(dayjs().startOf("month"));
  const [dayMap, setDayMap] = useState<Map<string, CalendarDayData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentAccountBook } = useAccountBookContext();
  const currentAccountBookId = currentAccountBook?.id ?? null;

  const categorySeqs = options?.categorySeqs;
  // 배열 참조가 매 렌더마다 바뀌어도 내용이 같으면 fetchData를 재생성하지 않도록 직렬화 key 사용
  const categorySeqsKey = useMemo(
    () => (categorySeqs && categorySeqs.length > 0 ? categorySeqs.slice().sort().join(",") : ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categorySeqs?.join(",")],
  );

  const fetchData = useCallback(async () => {
    if (!currentAccountBookId) {
      setDayMap(new Map());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const startDate = month.startOf("month").format("YYYYMMDD");
      const endDate = month.endOf("month").format("YYYYMMDD");
      // 캘린더는 페이지네이션 없이 한 달 전체를 가져옴 (최대 500건)
      const result = await transactionApi.getTransactions(
        currentAccountBookId,
        startDate,
        endDate,
        0,
        500,
        categorySeqs && categorySeqs.length > 0 ? categorySeqs : undefined,
      );

      // 날짜별로 그룹화
      const map = new Map<string, CalendarDayData>();
      for (const tx of result.transactions) {
        const key = dayjs(tx.transactionDate).format("YYYY-MM-DD");
        if (!map.has(key)) {
          map.set(key, { income: 0, expense: 0, transactions: [] });
        }
        const entry = map.get(key)!;
        if (tx.type === "INCOME") entry.income += tx.amount;
        else entry.expense += tx.amount;
        entry.transactions.push(tx);
      }
      // 각 날짜의 거래를 시간순 정렬
      for (const entry of map.values()) {
        entry.transactions.sort((a, b) =>
          a.transactionDate.localeCompare(b.transactionDate),
        );
      }
      setDayMap(map);
    } catch (err) {
      setError(getServerErrorMessage(err, "캘린더 데이터를 불러오는 중 오류가 발생했습니다."));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccountBookId, month, categorySeqsKey]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // FAB에서 거래 추가 시 자동 새로고침
  useEffect(() => {
    const handler = () => { void fetchData(); };
    window.addEventListener("sodam:transaction-added", handler);
    return () => window.removeEventListener("sodam:transaction-added", handler);
  }, [fetchData]);

  return { month, setMonth, dayMap, loading, error, refresh: fetchData };
};
