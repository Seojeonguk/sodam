export interface TransactionListResponse {
  transactions: TransactionListItemResponse[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface TransactionListItemResponse {
  seq: number;
  amount: number;
  description: string;
  transactionDate: string;
  type: "EXPENSE" | "INCOME";
  categoryName: string | null;
}

export interface TransactionResponseDto {
  seq: number;
  accountBookSeq?: number;
  userSeq?: number;
  categorySeq?: number;
  amount: number;
  description: string;
  transactionDate: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  satisfactionRating: number;
}

export interface TransactionCreateRequestDto {
  accountBookSeq: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  categorySeq: number | null;
  description?: string;
  transactionDate: string;
}

export interface TransactionUpdateRequestDto {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount?: number;
  categorySeq?: number;
  description?: string;
  transactionDate?: string;
}
