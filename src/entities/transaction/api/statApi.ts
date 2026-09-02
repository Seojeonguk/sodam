import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../guest/lib/guestStore";
import type {
  StatPeriodRequest,
  StatPeriodResponse,
  StatRequest,
  StatResponse,
} from "./stat.types";

/** 거래 필터 조건을 공통으로 적용 */
async function fetchFilteredTransactions(
  accountBookSeq: number,
  startDate: string,
  endDate: string,
  categorySeqs?: number[],
  keyword?: string,
  minAmount?: number,
  maxAmount?: number,
) {
  let query = supabase
    .from("transaction")
    .select("amount, type, category_seq, description, transaction_date, category:category_seq(name)")
    .eq("account_book_seq", accountBookSeq)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate + "235959");

  if (categorySeqs && categorySeqs.length > 0) query = query.in("category_seq", categorySeqs);
  if (keyword) query = query.ilike("description", `%${keyword}%`);
  if (minAmount != null) query = query.gte("amount", minAmount);
  if (maxAmount != null) query = query.lte("amount", maxAmount);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

const statApi = {
  /** 카테고리별 합계 */
  getStats: async (req: StatRequest): Promise<StatResponse[]> => {
    if (guestMode.isActive())
      return guestStore.getStats(
        req.startDate, req.endDate, req.categorySeqs,
        req.keyword, req.minAmount, req.maxAmount,
      );

    await getUserSeq(); // 세션 확인
    const rows = await fetchFilteredTransactions(
      req.accountBookSeq, req.startDate, req.endDate,
      req.categorySeqs, req.keyword, req.minAmount, req.maxAmount,
    );

    // GROUP BY (category_seq, type) → StatResponse[]
    const map = new Map<string, StatResponse>();
    for (const raw of rows) {
      const row = raw as Record<string, unknown>;
      const category = row.category as Record<string, unknown> | null;
      const catName = (category?.name as string | undefined) ?? "미분류";
      const type = row.type as string;
      const key = `${type}::${(row.category_seq as number | null) ?? "null"}`;
      const existing = map.get(key);
      if (existing) {
        existing.total += Number(row.amount);
      } else {
        map.set(key, { total: Number(row.amount), type, name: catName });
      }
    }

    return Array.from(map.values());
  },

  /** 기간(월)별 합계 */
  getPeriodStats: async (req: StatPeriodRequest): Promise<StatPeriodResponse[]> => {
    if (guestMode.isActive())
      return guestStore.getPeriodStats(
        req.startDate, req.endDate, req.categorySeqs,
        req.keyword, req.minAmount, req.maxAmount,
      );

    await getUserSeq(); // 세션 확인
    const rows = await fetchFilteredTransactions(
      req.accountBookSeq, req.startDate, req.endDate,
      req.categorySeqs, req.keyword, req.minAmount, req.maxAmount,
    );

    // GROUP BY (YYYYMM, type) → StatPeriodResponse[]
    const map = new Map<string, StatPeriodResponse>();
    for (const row of rows) {
      const period = (row.transaction_date as string).substring(0, 6); // YYYYMM
      const key = `${period}::${row.type}`;
      const existing = map.get(key);
      if (existing) {
        existing.total += Number(row.amount);
      } else {
        map.set(key, { total: Number(row.amount), type: row.type as string, transaction_date: period });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.transaction_date.localeCompare(b.transaction_date),
    );
  },
};

export default statApi;
