import dayjs from "dayjs";
import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../guest/lib/guestStore";
import type { BudgetRequest, BudgetResponse, BudgetSummaryResponse } from "./budget.types";

const now = () => dayjs().format("YYYYMMDDHHmmss");

const budgetApi = {
  upsertBudget: async (data: BudgetRequest): Promise<BudgetResponse> => {
    if (guestMode.isActive()) return guestStore.upsertBudget(data);

    const userSeq = await getUserSeq();
    const ts = now();

    // budget UNIQUE(account_book_seq, category_seq, setting_day) → upsert
    const { data: row, error } = await supabase
      .from("budget")
      .upsert(
        {
          account_book_seq: data.accountBookSeq,
          user_seq: userSeq,
          category_seq: data.categorySeq,
          setting_day: data.yearMonth,
          amount: data.amount,
          created_at: ts,
          updated_at: ts,
        },
        { onConflict: "account_book_seq,category_seq,setting_day" },
      )
      .select("id, account_book_seq, category_seq, setting_day, amount")
      .single();

    if (error || !row) throw new Error(error?.message ?? "예산 저장 실패");

    return {
      id: row.id as number,
      accountBookSeq: row.account_book_seq as number,
      categorySeq: row.category_seq as number,
      yearMonth: row.setting_day as string,
      amount: Number(row.amount),
    };
  },

  deleteBudget: async (id: number): Promise<void> => {
    if (guestMode.isActive()) { guestStore.deleteBudget(id); return; }

    const { error } = await supabase.from("budget").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  getBudgetSummary: async (
    accountBookSeq: number,
    yearMonth: string,
  ): Promise<BudgetSummaryResponse[]> => {
    if (guestMode.isActive()) return guestStore.getBudgetSummary(accountBookSeq, yearMonth);

    // getUserSeq() 호출로 세션 유효성 확인 (카테고리도 이제 가계부 단위로 조회)
    await getUserSeq();

    // 해당 월 예산 조회
    const { data: budgets, error: budgetErr } = await supabase
      .from("budget")
      .select("id, category_seq, setting_day, amount")
      .eq("account_book_seq", accountBookSeq)
      .eq("setting_day", yearMonth);

    if (budgetErr) throw new Error(budgetErr.message);

    // 카테고리 전체 조회 (가계부 단위 공유)
    const { data: categories, error: catErr } = await supabase
      .from("category")
      .select("id, name, color, type")
      .eq("account_book_seq", accountBookSeq);

    if (catErr) throw new Error(catErr.message);

    // 해당 월 실제 지출 조회
    const startDate = yearMonth + "01000000";
    const endDate   = yearMonth + "31235959";

    const { data: transactions, error: txErr } = await supabase
      .from("transaction")
      .select("amount, type, category_seq")
      .eq("account_book_seq", accountBookSeq)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate);

    if (txErr) throw new Error(txErr.message);

    // 카테고리별 실제 금액 집계
    const actualMap = new Map<number | null, number>();
    for (const tx of transactions ?? []) {
      const key = tx.category_seq as number | null;
      actualMap.set(key, (actualMap.get(key) ?? 0) + Number(tx.amount));
    }

    const catMap = new Map((categories ?? []).map((c: any) => [c.id as number, c]));

    // 예산이 있는 카테고리 먼저
    const result: BudgetSummaryResponse[] = (budgets ?? []).map((b: any) => {
      const cat = catMap.get(b.category_seq as number) as any;
      const budgetAmount = Number(b.amount);
      const actualAmount = actualMap.get(b.category_seq as number) ?? 0;
      const ratio = budgetAmount > 0 ? Math.round((actualAmount / budgetAmount) * 100) : -1;

      return {
        budgetId: b.id as number,
        categorySeq: b.category_seq as number,
        categoryName: cat?.name ?? "미분류",
        categoryColor: cat?.color ?? null,
        categoryType: cat?.type ?? "EXPENSE",
        budgetAmount,
        actualAmount,
        ratio,
        over: actualAmount > budgetAmount,
        hasBudget: true,
      };
    });

    return result;
  },

  copyBudgets: async (
    accountBookSeq: number,
    fromYearMonth: string,
    toYearMonth: string,
  ): Promise<number> => {
    if (guestMode.isActive()) return guestStore.copyBudgets(accountBookSeq, fromYearMonth, toYearMonth);

    const userSeq = await getUserSeq();

    const { data: source, error: srcErr } = await supabase
      .from("budget")
      .select("category_seq, amount")
      .eq("account_book_seq", accountBookSeq)
      .eq("setting_day", fromYearMonth);

    if (srcErr) throw new Error(srcErr.message);
    if (!source || source.length === 0) return 0;

    const ts = now();
    const rows = source.map((b: any) => ({
      account_book_seq: accountBookSeq,
      user_seq: userSeq,
      category_seq: b.category_seq,
      setting_day: toYearMonth,
      amount: b.amount,
      created_at: ts,
      updated_at: ts,
    }));

    const { error: upsertErr } = await supabase
      .from("budget")
      .upsert(rows, { onConflict: "account_book_seq,category_seq,setting_day" });

    if (upsertErr) throw new Error(upsertErr.message);
    return rows.length;
  },
};

export default budgetApi;
