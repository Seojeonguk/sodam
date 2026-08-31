/** 분류명 → 한글 표시 라벨 */
export const TYPE_LABEL: Record<string, string> = {
  INCOME:   "수입",
  EXPENSE:  "지출",
  TRANSFER: "이체",
};

/** 분류명 → MUI 색상 키 */
export const TYPE_MUI_COLOR: Record<string, "success" | "error" | "info" | "default"> = {
  INCOME:   "success",
  EXPENSE:  "error",
  TRANSFER: "info",
};

/** 분류명 → ToggleButton selected 스타일 (솔리드) */
export const TYPE_SOLID_STYLE = (name: string) => {
  const color = TYPE_MUI_COLOR[name] ?? "default";
  const colorMap: Record<string, { bg: string; hover: string }> = {
    success: { bg: "success.main", hover: "success.dark" },
    error:   { bg: "error.main",   hover: "error.dark"   },
    info:    { bg: "info.main",    hover: "info.dark"     },
    default: { bg: "action.selected", hover: "action.selected" },
  };
  const { bg, hover } = colorMap[color];
  return {
    "&.Mui-selected": { bgcolor: bg, color: "white", "&:hover": { bgcolor: hover } },
  } as const;
};

/** 분류명 → 금액 앞 부호 (INCOME=+, EXPENSE=-, 그 외 빈 문자열) */
export const TYPE_SIGN = (type: string): string =>
  type === "INCOME" ? "+" : type === "EXPENSE" ? "-" : "";

/** 기본 fallback 분류 목록 (API 실패 시) */
export const FALLBACK_CLASSIFICATIONS = [
  { id: -1, name: "EXPENSE" as const },
  { id: -2, name: "INCOME"  as const },
];
