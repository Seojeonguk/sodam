import api from "../../../shared/api/api";
import type {
  CategoryListResponse,
  CategoryListItemResponse,
} from "../../transaction/api/category.types";
import type { CommonResponse } from "../../../shared/api/response.types";

const CATEGORY_BASE_URL = "/categories";

const categoryApi = {
  // 카테고리 목록 조회
  getCategories: async (
    page = 0,
    size = 100,
  ): Promise<CommonResponse<CategoryListResponse>> => {
    const response = (await api.get<CommonResponse<CategoryListResponse>>(
      `${CATEGORY_BASE_URL}?page=${page}&size=${size}`,
    )) as unknown as CommonResponse<CategoryListResponse>;
    return response;
  },

  // 카테고리 생성
  createCategory: async (data: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<CommonResponse<CategoryListItemResponse>> => {
    const response = (await api.post<CommonResponse<CategoryListItemResponse>>(
      CATEGORY_BASE_URL,
      data,
    )) as unknown as CommonResponse<CategoryListItemResponse>;
    return response;
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
  ): Promise<CommonResponse<CategoryListItemResponse>> => {
    const response = (await api.put<CommonResponse<CategoryListItemResponse>>(
      `${CATEGORY_BASE_URL}/${id}`,
      data,
    )) as unknown as CommonResponse<CategoryListItemResponse>;
    return response;
  },
};

export default categoryApi;
