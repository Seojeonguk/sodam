export interface StatRequest {
  startDate: string;
  endDate: string;
}

export interface StatResponse {
  total: number;
  type: string;
  name: string;
}

export interface StatPeriodRequest {
  startDate: string;
  endDate: string;
}

export interface StatPeriodResponse {
  total: number;
  type: string;
  transaction_date: string;
}
