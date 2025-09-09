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
}
