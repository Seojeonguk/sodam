export interface StatRequest {
  startDate: string;
  endDate: string;
  categorySeq?: number;
}

export interface StatResponse {
  total: number;
  type: string;
  name: string;
}

export interface StatPeriodRequest {
  startDate: string;
  endDate: string;
  categorySeq?: number;
}

export interface StatPeriodResponse {
  total: number;
  type: string;
  transaction_date: string;
}
