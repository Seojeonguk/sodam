export const DEFAULT_PAGE_INDEX = 0;
export const DEFAULT_CATEGORY_PAGE_SIZE = 1000; /* 카테고리는 페이징 없이 전체 조회 */
export const CATEGORY_SELECTION_PAGE_SIZE = 100;

export const API_BASE_URL =
  import.meta.env.VITE_API_TRANSACTION_BASE_URL ?? "http://localhost:8080/api";
