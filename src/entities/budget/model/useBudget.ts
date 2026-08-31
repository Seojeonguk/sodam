import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import budgetApi from "../api/budgetApi";
import type { BudgetSummaryResponse } from "../api/budget.types";
import { useAccountBookContext } from "../../accountbook/model/AccountBookContext";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

export const useBudget = () => {
  const { currentAccountBook } = useAccountBookContext();
  const accountBookId = currentAccountBook?.id ?? null;

  const [yearMonth, setYearMonth] = useState<string>(dayjs().format("YYYYMM"));
  const [summary, setSummary] = useState<BudgetSummaryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!accountBookId) {
      setSummary([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await budgetApi.getBudgetSummary(accountBookId, yearMonth);
      setSummary(data);
    } catch (err) {
      setError(getServerErrorMessage(err, "예산 데이터를 불러오는 중 오류가 발생했습니다."));
    } finally {
      setLoading(false);
    }
  }, [accountBookId, yearMonth]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  const upsertBudget = useCallback(
    async (categorySeq: number, amount: number) => {
      if (!accountBookId) return;
      await budgetApi.upsertBudget({ accountBookSeq: accountBookId, categorySeq, yearMonth, amount });
      await fetchSummary();
    },
    [accountBookId, yearMonth, fetchSummary],
  );

  const deleteBudget = useCallback(
    async (budgetId: number) => {
      await budgetApi.deleteBudget(budgetId);
      await fetchSummary();
    },
    [fetchSummary],
  );

  /** fromYearMonth의 예산을 현재 yearMonth로 복사 */
  const copyFromMonth = useCallback(
    async (fromYearMonth: string): Promise<number> => {
      if (!accountBookId) return 0;
      const count = await budgetApi.copyBudgets(accountBookId, fromYearMonth, yearMonth);
      await fetchSummary();
      return count;
    },
    [accountBookId, yearMonth, fetchSummary],
  );

  /** 지출 예산 합계 */
  const totalBudget = summary
    .filter((s) => s.hasBudget && s.categoryType === "EXPENSE")
    .reduce((acc, s) => acc + s.budgetAmount, 0);

  /** 지출 실사용 합계 */
  const totalActual = summary
    .filter((s) => s.categoryType === "EXPENSE")
    .reduce((acc, s) => acc + s.actualAmount, 0);

  const totalRatio = totalBudget > 0 ? Math.min((totalActual / totalBudget) * 100, 999) : -1;

  return {
    yearMonth, setYearMonth,
    summary, loading, error,
    fetchSummary, upsertBudget, deleteBudget, copyFromMonth,
    totalBudget, totalActual, totalRatio,
  };
};
