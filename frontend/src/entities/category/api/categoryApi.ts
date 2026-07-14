import api from "../../../shared/api/api";
import {
  CATEGORY_SELECTION_PAGE_SIZE,
  DEFAULT_PAGE_INDEX,
} from "../../../shared/config/app";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../../shared/lib/guestStore";
import type {
  CategoryListItemResponse,
  CategoryListResponse,
} from "../../transaction/api/category.types";

const CATEGORY_BASE_URL = "/categories";

export interface CategoryUpsertRequest {
  name: string;
  description?: string;
  color?: string;
  /** INCOME 또는 EXPENSE */
  type: "INCOME" | "EXPENSE";
}

const categoryApi = {
  getCategories: async (
    page = DEFAULT_PAGE_INDEX,
    size = CATEGORY_SELECTION_PAGE_SIZE,
    type?: "INCOME" | "EXPENSE",
  ): Promise<CategoryListResponse> => {
    if (guestMode.isActive()) return guestStore.getCategories(page, size, type);
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (type) params.set("type", type);
    return api.get<CategoryListResponse>(`${CATEGORY_BASE_URL}?${params.toString()}`);
  },

  createCategory: async (
    data: CategoryUpsertRequest,
  ): Promise<CategoryListItemResponse> => {
    if (guestMode.isActive()) return guestStore.createCategory(data);
    return api.post<CategoryListItemResponse, CategoryUpsertRequest>(
      CATEGORY_BASE_URL,
      data,
    );
  },

  deleteCategory: async (id: number, replacementId: number): Promise<void> => {
    if (guestMode.isActive()) {
      guestStore.deleteCategory(id, replacementId);
      return;
    }
    await api.delete(`${CATEGORY_BASE_URL}/${id}`, {
      data: { replaceCategoryId: replacementId },
    });
  },

  updateCategory: async (
    id: number,
    data: CategoryUpsertRequest,
  ): Promise<CategoryListItemResponse> => {
    if (guestMode.isActive()) return guestStore.updateCategory(id, data);
    return api.put<CategoryListItemResponse, CategoryUpsertRequest>(
      `${CATEGORY_BASE_URL}/${id}`,
      data,
    );
  },
};

export default categoryApi;
