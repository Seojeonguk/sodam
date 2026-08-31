import dayjs from "dayjs";
import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../../shared/lib/guestStore";
import type { RecurringTransactionRequest, RecurringTransactionResponse } from "./recurring.types";

const now = () => dayjs().format("YYYYMMDDHHmmss");

const toResponse = (row: any, catName?: string): RecurringTransactionResponse => ({
  id: row.id as number,
  accountBookSeq: row.account_book_seq as number,
  categorySeq: row.category_seq as number | null,
  categoryName: catName ?? (row.category?.name as string | undefined) ?? "",
  amount: Number(row.amount),
  description: row.description as string | undefined,
  type: row.type as "INCOME" | "EXPENSE",
  dayOfMonth: row.day_of_month as number,
  isActive: row.is_active as boolean,
  createdAt: row.created_at as string,
});

const recurringApi = {
  getList: async (accountBookSeq: number): Promise<RecurringTransactionResponse[]> => {
    if (guestMode.isActive()) return guestStore.getRecurringList(accountBookSeq);

    const { data, error } = await supabase
      .from("recurring_transaction")
      .select(`
        id, account_book_seq, user_seq, category_seq, amount,
        description, type, day_of_month, is_active, created_at,
        category:category_seq(name)
      `)
      .eq("account_book_seq", accountBookSeq)
      .order("id");

    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => toResponse(row));
  },

  create: async (data: RecurringTransactionRequest): Promise<RecurringTransactionResponse> => {
    if (guestMode.isActive()) return guestStore.createRecurring(data);

    const userSeq = await getUserSeq();
    const ts = now();

    const { data: row, error } = await supabase
      .from("recurring_transaction")
      .insert({
        account_book_seq: data.accountBookSeq,
        user_seq: userSeq,
        category_seq: data.categorySeq ?? null,
        amount: data.amount,
        description: data.description ?? "",
        type: data.type,
        day_of_month: data.dayOfMonth,
        is_active: true,
        created_at: ts,
        updated_at: ts,
      })
      .select(`id, account_book_seq, user_seq, category_seq, amount, description, type, day_of_month, is_active, created_at, category:category_seq(name)`)
      .single();

    if (error || !row) throw new Error(error?.message ?? "반복 거래 생성 실패");
    return toResponse(row);
  },

  update: async (id: number, data: RecurringTransactionRequest): Promise<RecurringTransactionResponse> => {
    if (guestMode.isActive()) return guestStore.updateRecurring(id, data);

    const { data: row, error } = await supabase
      .from("recurring_transaction")
      .update({
        category_seq: data.categorySeq ?? null,
        amount: data.amount,
        description: data.description ?? "",
        type: data.type,
        day_of_month: data.dayOfMonth,
        updated_at: now(),
      })
      .eq("id", id)
      .select(`id, account_book_seq, user_seq, category_seq, amount, description, type, day_of_month, is_active, created_at, category:category_seq(name)`)
      .single();

    if (error || !row) throw new Error(error?.message ?? "반복 거래 수정 실패");
    return toResponse(row);
  },

  toggle: async (id: number): Promise<RecurringTransactionResponse> => {
    if (guestMode.isActive()) return guestStore.toggleRecurring(id);

    // 현재 상태 조회 후 토글
    const { data: current, error: fetchErr } = await supabase
      .from("recurring_transaction")
      .select("is_active")
      .eq("id", id)
      .single();

    if (fetchErr || !current) throw new Error(fetchErr?.message ?? "조회 실패");

    const { data: row, error } = await supabase
      .from("recurring_transaction")
      .update({ is_active: !current.is_active, updated_at: now() })
      .eq("id", id)
      .select(`id, account_book_seq, user_seq, category_seq, amount, description, type, day_of_month, is_active, created_at, category:category_seq(name)`)
      .single();

    if (error || !row) throw new Error(error?.message ?? "토글 실패");
    return toResponse(row);
  },

  delete: async (id: number): Promise<void> => {
    if (guestMode.isActive()) { guestStore.deleteRecurring(id); return; }

    const { error } = await supabase.from("recurring_transaction").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export default recurringApi;
