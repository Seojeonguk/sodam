import api from "../../../shared/api/api";
import type {
  CategoryListItemResponse,
  CategoryListResponse,
} from "../../transaction/api/category.types";

const CATEGORY_BASE_URL = "/categories";

interface CategoryUpsertRequest {
  name: string;
  description?: string;
  color?: string;
}

const categoryApi = {
  getCategories: async (
    page = 0,
    size = 100,
  ): Promise<CategoryListResponse> =>
    api.get<CategoryListResponse>(
      `${CATEGORY_BASE_URL}?page=${page}&size=${size}`,
    ),

  createCategory: async (
    data: CategoryUpsertRequest,
  ): Promise<CategoryListItemResponse> =>
    api.post<CategoryListItemResponse, CategoryUpsertRequest>(
      CATEGORY_BASE_URL,
      data,
    ),

  deleteCategory: async (id: number, replacementId: number): Promise<void> => {
    await api.delete(`${CATEGORY_BASE_URL}/${id}`, {
      data: { replaceCategoryId: replacementId },
    });
  },

  updateCategory: async (
    id: number,
    data: CategoryUpsertRequest,
  ): Promise<CategoryListItemResponse> =>
    api.put<CategoryListItemResponse, CategoryUpsertRequest>(
      `${CATEGORY_BASE_URL}/${id}`,
      data,
    ),
};

export default categoryApi;
