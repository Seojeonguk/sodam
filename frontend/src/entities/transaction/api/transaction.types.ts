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
  type: "INCOME" | "EXPENSE";
  satisfactionRating: number;
}

export interface TransactionCreateRequestDto {
  accountBookSeq: number;
  type: "INCOME" | "EXPENSE"; // 소득 또는 지출
  amount: number; // 금액
  categorySeq: number | null; // 카테고리 (예: '식비', '월급')
  description?: string; // 상세 내용 (선택 사항)
  transactionDate: string; // 거래 날짜 및 시간 (예: "2025-06-08T10:30:00")
}

export interface TransactionUpdateRequestDto {
  type: "INCOME" | "EXPENSE";
  amount?: number;
  categorySeq?: number;
  description?: string;
  transactionDate?: string;
}
