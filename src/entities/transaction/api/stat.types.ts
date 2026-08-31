export interface StatRequest {
  accountBookSeq: number;
  startDate: string;
  endDate: string;
  categorySeqs?: number[];
  keyword?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface StatResponse {
  total: number;
  type: string;
  name: string;
}

export interface StatPeriodRequest {
  accountBookSeq: number;
  startDate: string;
  endDate: string;
  categorySeqs?: number[];
  keyword?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface StatPeriodResponse {
  total: number;
  type: string;
  transaction_date: string;
}
