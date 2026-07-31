export interface RecurringTransactionRequest {
  accountBookSeq: number;
  categorySeq?: number | null;
  amount: number;
  description?: string;
  type: "INCOME" | "EXPENSE";
  dayOfMonth: number;
}

export interface RecurringTransactionResponse {
  id: number;
  accountBookSeq: number;
  categorySeq?: number | null;
  categoryName: string;
  amount: number;
  description?: string;
  type: "INCOME" | "EXPENSE";
  dayOfMonth: number;
  isActive: boolean;
  createdAt: string;
}
