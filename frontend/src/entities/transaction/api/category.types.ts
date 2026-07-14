export interface CategoryListResponse {
  categories: CategoryListItemResponse[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface CategoryListItemResponse {
  id: number;
  name: string;
  description: string;
  color: string | null;
  /** INCOME(수입) 또는 EXPENSE(지출) */
  type: "INCOME" | "EXPENSE";
}
