import dayjs from "dayjs";
import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../../shared/lib/guestStore";
import assetApi from "../../asset/api/assetApi";
import type {
  TransactionCreateRequestDto,
  TransactionListResponse,
  TransactionResponseDto,
  TransactionUpdateRequestDto,
} from "./transaction.types";

const now = () => dayjs().format("YYYYMMDDHHmmss");

/** ISO 날짜 → DB 포맷 (YYYYMMDDHHmmss) */
const toDbDate = (iso: string) => dayjs(iso).format("YYYYMMDDHHmmss");

const transactionApi = {
  getTransactions: async (
    accountId: number,
    startDate?: string,
    endDate?: string,
    page = 0,
    size = 10,
    categorySeqs?: number[],
    keyword?: string,
    minAmount?: number,
    maxAmount?: number,
    typeFilter?: string,
  ): Promise<TransactionListResponse> => {
    if (guestMode.isActive())
      return guestStore.getTransactions(
        accountId, startDate, endDate, page, size,
        categorySeqs, keyword, minAmount, maxAmount,
      );

    const userSeq = await getUserSeq();

    let query = supabase
      .from("transaction")
      .select(
        `seq, amount, description, transaction_date, type,
         category:category_seq(name)`,
        { count: "exact" },
      )
      .eq("account_book_seq", accountId)
      .eq("user_seq", userSeq)
      .order("transaction_date", { ascending: false })
      .range(page * size, (page + 1) * size - 1);

    if (startDate) query = query.gte("transaction_date", startDate);
    if (endDate)   query = query.lte("transaction_date", endDate + "235959");
    if (categorySeqs && categorySeqs.length > 0)
      query = query.in("category_seq", categorySeqs);
    if (keyword)
      query = query.ilike("description", `%${keyword}%`);
    if (minAmount != null) query = query.gte("amount", minAmount);
    if (maxAmount != null) query = query.lte("amount", maxAmount);
    if (typeFilter) query = query.eq("type", typeFilter);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const transactions = (data ?? []).map((row: any) => ({
      seq: row.seq as number,
      amount: Number(row.amount),
      description: row.description as string,
      transactionDate: row.transaction_date as string,
      type: row.type as "INCOME" | "EXPENSE",
      categoryName: (row.category as any)?.name ?? null,
    }));

    const totalElements = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));

    return { transactions, pageNumber: page, pageSize: size, totalElements, totalPages };
  },

  createTransaction: async (
    data: TransactionCreateRequestDto,
  ): Promise<TransactionResponseDto> => {
    if (guestMode.isActive()) return guestStore.createTransaction(data);

    const userSeq = await getUserSeq();
    const ts = now();

    const { data: row, error } = await supabase
      .from("transaction")
      .insert({
        account_book_seq: data.accountBookSeq,
        user_seq: userSeq,
        category_seq: data.categorySeq,
        amount: data.amount,
        description: data.description ?? "",
        transaction_date: toDbDate(data.transactionDate),
        type: data.type,
        asset_seq: data.assetSeq ?? null,
        satisfaction_rating: data.satisfactionRating ?? 0,
        created_at: ts,
        updated_at: ts,
      })
      .select("seq, account_book_seq, user_seq, category_seq, asset_seq, amount, description, transaction_date, type, satisfaction_rating")
      .single();

    if (error || !row) throw new Error(error?.message ?? "거래 생성 실패");

    // 자산 잔액 자동 반영 (best-effort)
    if (data.assetSeq) {
      try {
        await assetApi.applyTransactionDelta(
          data.assetSeq, row.seq as number, data.type, data.amount,
        );
      } catch (e) {
        console.warn("자산 잔액 반영 실패:", e);
      }
    }

    return {
      seq: row.seq as number,
      accountBookSeq: row.account_book_seq as number,
      userSeq: row.user_seq as number,
      categorySeq: row.category_seq as number | undefined,
      amount: Number(row.amount),
      description: row.description as string,
      transactionDate: row.transaction_date as string,
      type: row.type as "INCOME" | "EXPENSE",
      satisfactionRating: row.satisfaction_rating as number,
    };
  },

  getTransactionBySeq: async (seq: number | null): Promise<TransactionResponseDto> => {
    if (guestMode.isActive()) {
      const tx = guestStore.getTransactionBySeq(seq!);
      if (!tx) throw new Error("거래를 찾을 수 없습니다.");
      return tx;
    }

    const { data: row, error } = await supabase
      .from("transaction")
      .select("seq, account_book_seq, user_seq, category_seq, category:category_seq(name), amount, description, transaction_date, type, satisfaction_rating")
      .eq("seq", seq)
      .single();

    if (error || !row) throw new Error(error?.message ?? "거래를 찾을 수 없습니다.");

    return {
      seq: row.seq as number,
      accountBookSeq: row.account_book_seq as number,
      userSeq: row.user_seq as number,
      categorySeq: row.category_seq as number | undefined,
      categoryName: (row.category as any)?.name ?? undefined,
      amount: Number(row.amount),
      description: row.description as string,
      transactionDate: row.transaction_date as string,
      type: row.type as "INCOME" | "EXPENSE",
      satisfactionRating: row.satisfaction_rating as number,
    };
  },

  updateTransaction: async (
    seq: number,
    data: TransactionUpdateRequestDto,
  ): Promise<TransactionResponseDto> => {
    if (guestMode.isActive()) return guestStore.updateTransaction(seq, data);

    // 수정 전 자산 정보 조회 (잔액 보정용)
    const { data: oldRow } = await supabase
      .from("transaction")
      .select("asset_seq, type, amount")
      .eq("seq", seq)
      .maybeSingle();

    const updates: Record<string, unknown> = { updated_at: now() };
    if (data.type)                      updates.type = data.type;
    if (data.amount != null)            updates.amount = data.amount;
    if (data.categorySeq != null)       updates.category_seq = data.categorySeq;
    if (data.description != null)       updates.description = data.description;
    if (data.transactionDate)           updates.transaction_date = toDbDate(data.transactionDate);
    if (data.satisfactionRating != null) updates.satisfaction_rating = data.satisfactionRating;

    const { data: row, error } = await supabase
      .from("transaction")
      .update(updates)
      .eq("seq", seq)
      .select("seq, account_book_seq, user_seq, category_seq, asset_seq, amount, description, transaction_date, type, satisfaction_rating")
      .single();

    if (error || !row) throw new Error(error?.message ?? "거래 수정 실패");

    // 자산 잔액 보정: 타입 또는 금액이 바뀌었을 때만 적용 (best-effort)
    if (oldRow?.asset_seq) {
      try {
        const oldType = oldRow.type as string;
        const oldAmt  = Number(oldRow.amount);
        const newType = data.type ?? oldType;
        const newAmt  = data.amount ?? oldAmt;
        if (oldType !== newType || oldAmt !== newAmt) {
          // 기존 효과 역산
          await assetApi.applyTransactionDelta(oldRow.asset_seq as number, seq, oldType, oldAmt, true);
          // 새 효과 적용
          await assetApi.applyTransactionDelta(oldRow.asset_seq as number, seq, newType, newAmt, false);
        }
      } catch (e) {
        console.warn("자산 잔액 보정 실패:", e);
      }
    }

    return {
      seq: row.seq as number,
      accountBookSeq: row.account_book_seq as number,
      userSeq: row.user_seq as number,
      categorySeq: row.category_seq as number | undefined,
      amount: Number(row.amount),
      description: row.description as string,
      transactionDate: row.transaction_date as string,
      type: row.type as "INCOME" | "EXPENSE",
      satisfactionRating: row.satisfaction_rating as number,
    };
  },

  deleteTransaction: async (seq: number): Promise<void> => {
    if (guestMode.isActive()) { guestStore.deleteTransaction(seq); return; }

    // 삭제 전 asset_seq, type, amount 조회 (잔액 복원용)
    const { data: txRow } = await supabase
      .from("transaction")
      .select("asset_seq, type, amount")
      .eq("seq", seq)
      .maybeSingle();

    const { error } = await supabase.from("transaction").delete().eq("seq", seq);
    if (error) throw new Error(error.message);

    // 자산 잔액 복원 (best-effort)
    if (txRow?.asset_seq) {
      try {
        await assetApi.applyTransactionDelta(
          txRow.asset_seq as number,
          seq,
          txRow.type as string,
          Number(txRow.amount),
          true, // reverse
        );
      } catch (e) {
        console.warn("자산 잔액 복원 실패:", e);
      }
    }
  },
};

export default transactionApi;
