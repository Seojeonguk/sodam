import dayjs from "dayjs";
import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../../shared/lib/guestStore";
import type { CategoryListItemResponse } from "../../transaction/api/category.types";

export interface CategoryUpsertRequest {
  name: string;
  description?: string;
  color?: string;
  type: "INCOME" | "EXPENSE";
}

const now = () => dayjs().format("YYYYMMDDHHmmss");

const categoryApi = {
  /** 카테고리 전체 목록 (배열 직접 반환) */
  getCategories: async (
    _page?: number,
    _size?: number,
    type?: "INCOME" | "EXPENSE",
  ): Promise<CategoryListItemResponse[]> => {
    if (guestMode.isActive()) {
      const res = guestStore.getCategories(0, 1000, type);
      return res.categories ?? [];
    }

    const userSeq = await getUserSeq();

    let query = supabase
      .from("category")
      .select("id, name, description, color, type")
      .eq("user_seq", userSeq)
      .order("name");

    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | undefined,
      color: row.color as string | undefined,
      type: row.type as "INCOME" | "EXPENSE",
    }));
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
