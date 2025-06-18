export interface PageResponse<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
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

export type TransactionListResponseDto = PageResponse<TransactionResponseDto>;
