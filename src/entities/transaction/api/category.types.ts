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
  /** INCOME(수입) / EXPENSE(지출) / TRANSFER(이체) */
  type: "INCOME" | "EXPENSE" | "TRANSFER";
}
