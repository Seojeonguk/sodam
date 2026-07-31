export interface BudgetRequest {
  accountBookSeq: number;
  categorySeq: number;
  /** YYYYMM */
  yearMonth: string;
  amount: number;
}

export interface BudgetResponse {
  id: number;
  accountBookSeq: number;
  categorySeq: number;
  yearMonth: string;
  amount: number;
}

export interface BudgetSummaryResponse {
  /** null이면 예산 미설정 */
  budgetId: number | null;
  categorySeq: number | null;
  categoryName: string;
  categoryColor: string | null;
  /** INCOME | EXPENSE */
  categoryType: string;
  budgetAmount: number;
  actualAmount: number;
  /** 0~100+, 예산 미설정이면 -1 */
  ratio: number;
  over: boolean;
  hasBudget: boolean;
}
