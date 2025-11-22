import api from "../../../utils/api";
import type {
  CategoryListResponse,
  CategoryListItemResponse,
} from "../../transaction/services/category.types";

const CATEGORY_BASE_URL = "/categories";

const categoryApi = {
  // 카테고리 목록 조회
  getCategories: async (
    page = 0,
    size = 100,
  ): Promise<CategoryListResponse> => {
    const response = await api.get<CategoryListResponse>(
      `${CATEGORY_BASE_URL}?page=${page}&size=${size}`,
    );
    return response.data;
  },

  // 카테고리 생성
  createCategory: async (data: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<CategoryListItemResponse> => {
    const response = await api.post<CategoryListItemResponse>(
      CATEGORY_BASE_URL,
      data,
    );
    return response.data;
  },

  // 카테고리 삭제
  deleteCategory: async (id: number, replacementId: number): Promise<void> => {
    await api.delete(`${CATEGORY_BASE_URL}/${id}`, {
      data: { replaceCategoryId: replacementId },
    });
  },

  // 카테고리 수정
  updateCategory: async (
    id: number,
    data: {
      name: string;
      description?: string;
      color?: string;
    },
  ): Promise<CategoryListItemResponse> => {
    const response = await api.put<CategoryListItemResponse>(
      `${CATEGORY_BASE_URL}/${id}`,
      data,
    );
    return response.data;
  },
};

export default categoryApi;
