export type AssetType = "BANK" | "CARD" | "CASH" | "INVESTMENT" | "POINT";

export const ASSET_TYPE_CONFIG: Record<
  AssetType,
  { label: string; color: string }
> = {
  BANK:       { label: "은행 통장",      color: "#1565c0" },
  CARD:       { label: "신용/체크카드",  color: "#6a1b9a" },
  CASH:       { label: "현금",           color: "#2e7d32" },
  INVESTMENT: { label: "투자/증권",      color: "#e65100" },
  POINT:      { label: "포인트",         color: "#f57f17" },
};

export const ASSET_TYPES: AssetType[] = [
  "BANK",
  "CARD",
  "CASH",
  "INVESTMENT",
  "POINT",
];

export interface AssetResponse {
  seq: number;
  accountBookSeq: number;
  userSeq: number;
  name: string;
  type: AssetType;
  balance: number;
  note?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetCreateRequest {
  name: string;
  type: AssetType;
  balance: number;
  note?: string;
  color?: string;
}

export interface AssetUpdateRequest {
  name?: string;
  type?: AssetType;
  note?: string;
  color?: string;
}

export interface AssetHistoryResponse {
  seq: number;
  assetSeq: number;
  balance: number;
  delta: number;
  source: "MANUAL" | "TRANSACTION";
  transactionSeq?: number;
  note?: string;
  recordedAt: string;
}
