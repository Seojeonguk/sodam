export interface PageResponse<T> {
  content: T[];
  pageable: any; // 필요에 따라 상세 정의
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: any; // 필요에 따라 상세 정의
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface TransactionResponseDto {
  id?: number;
  seq?: number;
  accountBookSeq?: number;
  userSeq?: number;
  categorySeq?: number;
  amount?: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  transactionDate: string;
  satisfactionRating: number;
}

export type TransactionListResponseDto = TransactionListResponseDto[];