import { useCallback, useEffect, useMemo, useState } from "react";
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

/** 분류 타입별 파이 통계 맵 반환 */
const buildTypeStats = (
  items: Awaited<ReturnType<typeof statApi.getStats>>,
): Record<string, PieValueType[]> => {
  const result: Record<string, PieValueType[]> = {};
  items.forEach((item, index) => {
    if (!result[item.type]) result[item.type] = [];
    result[item.type].push({
      id: index,
      value: item.total,
      label: item.name,
      color: getRandomColor(),
    });
  });
  return result;
};

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
  const [typeStats, setTypeStats] = useState<Record<string, PieValueType[]>>({});
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

  /** 카테고리 다건 필터 (빈 배열 = 전체) */
  const [categoryFilter, setCategoryFilter] = useState<number[]>([]);
  /** 키워드 검색 */
  const [keyword, setKeyword] = useState("");
  /** 금액 범위 */
  const [minAmount, setMinAmount] = useState<number | undefined>(undefined);
  const [maxAmount, setMaxAmount] = useState<number | undefined>(undefined);

  /**
   * Dayjs 객체는 매 setDateRange 호출 시 새 참조가 생성되어 useCallback 의존성이
   * 불필요하게 재생성됨. 날짜 문자열로 메모화하여 같은 날짜면 re-fetch 방지.
   */
  const startDateStr = useMemo(
    () => dateRange.startDate.format("YYYYMMDD"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateRange.startDate.valueOf()],
  );
  const endDateStr = useMemo(
    () => dateRange.endDate.format("YYYYMMDD"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateRange.endDate.valueOf()],
  );

  /** 검색 조건 변경 시 첫 페이지로 리셋 */
  useEffect(() => {
    setPage(0);
  }, [startDateStr, endDateStr, categoryFilter, keyword, minAmount, maxAmount]);

  const resetTransactionState = useCallback(() => {
    setTransactions(null);
    setTypeStats({});
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

    const startDate = startDateStr;
    const endDate = endDateStr;

    const statRequest: StatRequest = {
      accountBookSeq: currentAccountBookId,
      startDate,
      endDate,
      ...(categoryFilter.length > 0 && { categorySeqs: categoryFilter }),
      ...(keyword.trim() && { keyword: keyword.trim() }),
      ...(minAmount != null && { minAmount }),
      ...(maxAmount != null && { maxAmount }),
    };
    const statPeriodRequest: StatPeriodRequest = {
      accountBookSeq: currentAccountBookId,
      startDate,
      endDate,
      ...(categoryFilter.length > 0 && { categorySeqs: categoryFilter }),
      ...(keyword.trim() && { keyword: keyword.trim() }),
      ...(minAmount != null && { minAmount }),
      ...(maxAmount != null && { maxAmount }),
    };

    try {
      const [nextTransactions, nextStats, nextPeriodStats] = await Promise.all([
        transactionApi.getTransactions(
          currentAccountBookId,
          startDate,
          endDate,
          page,
          pageSize,
          categoryFilter.length > 0 ? categoryFilter : undefined,
          keyword.trim() || undefined,
          minAmount,
          maxAmount,
        ),
        statApi.getStats(statRequest),
        statApi.getPeriodStats(statPeriodRequest),
      ]);

      setTransactions(nextTransactions);
      setTypeStats(buildTypeStats(nextStats));
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
    startDateStr,
    endDateStr,
    page,
    pageSize,
    categoryFilter,
    keyword,
    minAmount,
    maxAmount,
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
    /** 분류 타입별 파이 통계 맵 (동적 분류 지원) */
    typeStats,
    /** 수입 통계 (typeStats["INCOME"] 별칭, 하위 호환) */
    incomeStats: typeStats["INCOME"] ?? [],
    /** 지출 통계 (typeStats["EXPENSE"] 별칭, 하위 호환) */
    expenseStats: typeStats["EXPENSE"] ?? [],
    statPeriodDataset,
    dateRange,
    setDateRange,
    /** 카테고리 다건 필터 (빈 배열 = 전체) */
    categoryFilter,
    setCategoryFilter,
    keyword,
    setKeyword,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
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
