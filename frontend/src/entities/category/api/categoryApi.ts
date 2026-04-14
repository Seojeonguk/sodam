import api from "../../../shared/api/api";
import type {
  CategoryListResponse,
  CategoryListItemResponse,
} from "../../transaction/api/category.types";

const CATEGORY_BASE_URL = "/categories";

const categoryApi = {
  getCategories: async (
    page = 0,
    size = 100,
  ): Promise<CategoryListResponse> => {
    const response = (await api.get<CategoryListResponse>(
      `${CATEGORY_BASE_URL}?page=${page}&size=${size}`,
    )) as CategoryListResponse;

    return response;
  },

  createCategory: async (data: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<CategoryListItemResponse> => {
    const response = (await api.post<CategoryListItemResponse>(
      CATEGORY_BASE_URL,
      data,
    )) as CategoryListItemResponse;

    return response;
  },

  deleteCategory: async (id: number, replacementId: number): Promise<void> => {
    await api.delete(`${CATEGORY_BASE_URL}/${id}`, {
      data: { replaceCategoryId: replacementId },
    });
  },

  updateCategory: async (
    id: number,
    data: {
      name: string;
      description?: string;
      color?: string;
    },
  ): Promise<CategoryListItemResponse> => {
    const response = (await api.put<CategoryListItemResponse>(
      `${CATEGORY_BASE_URL}/${id}`,
      data,
    )) as CategoryListItemResponse;

    return response;
  },
};

export default categoryApi;
