import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../../shared/lib/guestStore";
import type {
  StatPeriodRequest,
  StatPeriodResponse,
  StatRequest,
  StatResponse,
} from "./stat.types";

/** 거래 필터 조건을 공통으로 적용 */
async function fetchFilteredTransactions(
  userSeq: number,
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
    .eq("user_seq", userSeq)
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

    const userSeq = await getUserSeq();
    const rows = await fetchFilteredTransactions(
      userSeq, req.startDate, req.endDate,
      req.categorySeqs, req.keyword, req.minAmount, req.maxAmount,
    );

    // GROUP BY (category_seq, type) → StatResponse[]
    const map = new Map<string, StatResponse>();
    for (const row of rows) {
      const catName = (row.category as any)?.name ?? "미분류";
      const key = `${row.type}::${row.category_seq ?? "null"}`;
      const existing = map.get(key);
      if (existing) {
        existing.total += Number(row.amount);
      } else {
        map.set(key, { total: Number(row.amount), type: row.type as string, name: catName });
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

    const userSeq = await getUserSeq();
    const rows = await fetchFilteredTransactions(
      userSeq, req.startDate, req.endDate,
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
