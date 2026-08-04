import dayjs from "dayjs";
import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
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

export interface CategoryUpsertRequest {
  name: string;
  description?: string;
  color?: string;
  type: "INCOME" | "EXPENSE";
}

const now = () => dayjs().format("YYYYMMDDHHmmss");

const categoryApi = {
  getCategories: async (
    page = DEFAULT_PAGE_INDEX,
    size = CATEGORY_SELECTION_PAGE_SIZE,
    type?: "INCOME" | "EXPENSE",
  ): Promise<CategoryListResponse> => {
    if (guestMode.isActive()) return guestStore.getCategories(page, size, type);

    const userSeq = await getUserSeq();

    let query = supabase
      .from("category")
      .select("id, name, description, color, type", { count: "exact" })
      .eq("user_seq", userSeq)
      .order("name")
      .range(page * size, (page + 1) * size - 1);

    if (type) query = query.eq("type", type);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const categories = (data ?? []).map((row: any) => ({
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | undefined,
      color: row.color as string | undefined,
      type: row.type as "INCOME" | "EXPENSE",
    }));

    return {
      categories,
      totalElements: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / size)),
      pageNumber: page,
      pageSize: size,
    } as CategoryListResponse;
  },

  createCategory: async (
    data: CategoryUpsertRequest,
  ): Promise<CategoryListItemResponse> => {
    if (guestMode.isActive()) return guestStore.createCategory(data);

    const userSeq = await getUserSeq();
    const ts = now();

    const { data: row, error } = await supabase
      .from("category")
      .insert({
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
        type: data.type,
        user_seq: userSeq,
        created_at: ts,
        updated_at: ts,
      })
      .select("id, name, description, color, type")
      .single();

    if (error || !row) throw new Error(error?.message ?? "카테고리 생성 실패");

    return {
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | undefined,
      color: row.color as string | undefined,
      type: row.type as "INCOME" | "EXPENSE",
    };
  },

  updateCategory: async (
    id: number,
    data: CategoryUpsertRequest,
  ): Promise<CategoryListItemResponse> => {
    if (guestMode.isActive()) return guestStore.updateCategory(id, data);

    const { data: row, error } = await supabase
      .from("category")
      .update({
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
        type: data.type,
        updated_at: now(),
      })
      .eq("id", id)
      .select("id, name, description, color, type")
      .single();

    if (error || !row) throw new Error(error?.message ?? "카테고리 수정 실패");

    return {
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | undefined,
      color: row.color as string | undefined,
      type: row.type as "INCOME" | "EXPENSE",
    };
  },

  deleteCategory: async (id: number, replacementId: number): Promise<void> => {
    if (guestMode.isActive()) { guestStore.deleteCategory(id, replacementId); return; }

    // 해당 카테고리의 거래를 대체 카테고리로 이동
    if (replacementId) {
      await supabase
        .from("transaction")
        .update({ category_seq: replacementId, updated_at: now() })
        .eq("category_seq", id);
    }

    const { error } = await supabase.from("category").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export default categoryApi;
