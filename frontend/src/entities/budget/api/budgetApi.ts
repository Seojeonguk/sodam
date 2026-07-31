import api from "../../../shared/api/api";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../../shared/lib/guestStore";
import type { BudgetRequest, BudgetResponse, BudgetSummaryResponse } from "./budget.types";

const BASE = "/budgets";

const budgetApi = {
  upsertBudget: async (data: BudgetRequest): Promise<BudgetResponse> => {
    if (guestMode.isActive()) return guestStore.upsertBudget(data);
    return api.post<BudgetResponse, BudgetRequest>(BASE, data);
  },

  deleteBudget: async (id: number): Promise<void> => {
    if (guestMode.isActive()) {
      guestStore.deleteBudget(id);
      return;
    }
    await api.delete(`${BASE}/${id}`);
  },

  getBudgetSummary: async (
    accountBookSeq: number,
    yearMonth: string,
  ): Promise<BudgetSummaryResponse[]> => {
    if (guestMode.isActive()) return guestStore.getBudgetSummary(accountBookSeq, yearMonth);
    return api.get<BudgetSummaryResponse[]>(`${BASE}/summary`, {
      params: { accountBookSeq, yearMonth },
    });
  },

  /** fromYearMonth 예산을 toYearMonth로 복사. 반환값: 복사된 예산 수 */
  copyBudgets: async (
    accountBookSeq: number,
    fromYearMonth: string,
    toYearMonth: string,
  ): Promise<number> => {
    if (guestMode.isActive()) return guestStore.copyBudgets(accountBookSeq, fromYearMonth, toYearMonth);
    return api.post<number>(`${BASE}/copy`, undefined, {
      params: { accountBookSeq, fromYearMonth, toYearMonth },
    });
  },
};

export default budgetApi;
