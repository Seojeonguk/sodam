import dayjs from "dayjs";
import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
import type {
  AssetCreateRequest,
  AssetHistoryResponse,
  AssetResponse,
  AssetUpdateRequest,
} from "./asset.types";

const now = () => dayjs().format("YYYYMMDDHHmmss");

function mapAsset(row: Record<string, unknown>): AssetResponse {
  return {
    seq:           row.seq as number,
    accountBookSeq: row.account_book_seq as number,
    userSeq:       row.user_seq as number,
    name:          row.name as string,
    type:          row.type as AssetResponse["type"],
    balance:       Number(row.balance),
    note:          row.note as string | undefined,
    color:         row.color as string | undefined,
    createdAt:     row.created_at as string,
    updatedAt:     row.updated_at as string,
  };
}

function mapHistory(row: Record<string, unknown>): AssetHistoryResponse {
  return {
    seq:            row.seq as number,
    assetSeq:       row.asset_seq as number,
    balance:        Number(row.balance),
    delta:          Number(row.delta),
    source:         row.source as "MANUAL" | "TRANSACTION",
    transactionSeq: row.transaction_seq as number | undefined,
    note:           row.note as string | undefined,
    recordedAt:     row.recorded_at as string,
  };
}

const assetApi = {
  /** 가계부 내 자산 목록 조회 */
  getAssets: async (accountBookId: number): Promise<AssetResponse[]> => {
    const { data, error } = await supabase
      .from("asset")
      .select("*")
      .eq("account_book_seq", accountBookId)
      .eq("is_available", "Y")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => mapAsset(r as Record<string, unknown>));
  },

  /** 자산 생성 (초기 잔액 히스토리도 함께 기록) */
  createAsset: async (
    accountBookId: number,
    req: AssetCreateRequest,
  ): Promise<AssetResponse> => {
    const userSeq = await getUserSeq();
    const ts = now();

    const { data, error } = await supabase
      .from("asset")
      .insert({
        account_book_seq: accountBookId,
        user_seq: userSeq,
        name: req.name,
        type: req.type,
        balance: req.balance,
        note: req.note ?? null,
        color: req.color ?? null,
        is_available: "Y",
        created_at: ts,
        updated_at: ts,
        created_by: userSeq,
        updated_by: userSeq,
      })
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "자산 생성 실패");

    // 초기 잔액 히스토리 기록
    if (req.balance !== 0) {
      await supabase.from("asset_history").insert({
        asset_seq: (data as Record<string, unknown>).seq,
        balance: req.balance,
        delta: req.balance,
        source: "MANUAL",
        note: "초기 잔액",
        recorded_at: ts,
        created_at: ts,
        created_by: userSeq,
      });
    }

    return mapAsset(data as Record<string, unknown>);
  },

  /** 자산 정보 수정 (이름·타입·메모·색상) */
  updateAsset: async (
    seq: number,
    req: AssetUpdateRequest,
  ): Promise<AssetResponse> => {
    const userSeq = await getUserSeq();
    const updates: Record<string, unknown> = {
      updated_at: now(),
      updated_by: userSeq,
    };
    if (req.name  !== undefined) updates.name  = req.name;
    if (req.type  !== undefined) updates.type  = req.type;
    if (req.note  !== undefined) updates.note  = req.note;
    if (req.color !== undefined) updates.color = req.color;

    const { data, error } = await supabase
      .from("asset")
      .update(updates)
      .eq("seq", seq)
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "자산 수정 실패");
    return mapAsset(data as Record<string, unknown>);
  },

  /** 자산 삭제 (soft delete) */
  deleteAsset: async (seq: number): Promise<void> => {
    const userSeq = await getUserSeq();
    const { error } = await supabase
      .from("asset")
      .update({ is_available: "N", updated_at: now(), updated_by: userSeq })
      .eq("seq", seq);
    if (error) throw new Error(error.message);
  },

  /** 잔액 수동 기록 (히스토리 + 현재 잔액 업데이트) */
  recordBalance: async (
    assetSeq: number,
    newBalance: number,
    note?: string,
  ): Promise<void> => {
    const userSeq = await getUserSeq();
    const ts = now();

    // 현재 잔액 조회
    const { data: assetRow, error: assetErr } = await supabase
      .from("asset")
      .select("balance")
      .eq("seq", assetSeq)
      .single();
    if (assetErr) throw new Error(assetErr.message);

    const prevBalance = Number((assetRow as Record<string, unknown>).balance);
    const delta = newBalance - prevBalance;

    // 현재 잔액 업데이트
    const { error: updateErr } = await supabase
      .from("asset")
      .update({ balance: newBalance, updated_at: ts, updated_by: userSeq })
      .eq("seq", assetSeq);
    if (updateErr) throw new Error(updateErr.message);

    // 히스토리 기록
    const { error: histErr } = await supabase
      .from("asset_history")
      .insert({
        asset_seq: assetSeq,
        balance: newBalance,
        delta,
        source: "MANUAL",
        note: note ?? null,
        recorded_at: ts,
        created_at: ts,
        created_by: userSeq,
      });
    if (histErr) throw new Error(histErr.message);
  },

  /**
   * 거래 연동 잔액 조정
   * type INCOME → +amount, EXPENSE → -amount
   * 거래 삭제 시 reverse=true
   */
  applyTransactionDelta: async (
    assetSeq: number,
    transactionSeq: number,
    type: string,
    amount: number,
    reverse = false,
  ): Promise<void> => {
    const userSeq = await getUserSeq();
    const ts = now();

    let delta =
      type === "INCOME" ? amount : type === "EXPENSE" ? -amount : 0;
    if (reverse) delta = -delta;
    if (delta === 0) return;

    // 현재 잔액 조회
    const { data: assetRow, error: assetErr } = await supabase
      .from("asset")
      .select("balance")
      .eq("seq", assetSeq)
      .single();
    if (assetErr) throw new Error(assetErr.message);

    const prevBalance = Number((assetRow as Record<string, unknown>).balance);
    const newBalance = prevBalance + delta;

    // 잔액 업데이트
    const { error: updateErr } = await supabase
      .from("asset")
      .update({ balance: newBalance, updated_at: ts, updated_by: userSeq })
      .eq("seq", assetSeq);
    if (updateErr) throw new Error(updateErr.message);

    // 히스토리 기록
    await supabase.from("asset_history").insert({
      asset_seq: assetSeq,
      balance: newBalance,
      delta,
      source: "TRANSACTION",
      transaction_seq: transactionSeq,
      note: reverse ? "거래 삭제" : "거래 연동",
      recorded_at: ts,
      created_at: ts,
      created_by: userSeq,
    });
  },

  /** 자산 잔액 히스토리 조회 */
  getHistory: async (assetSeq: number): Promise<AssetHistoryResponse[]> => {
    const { data, error } = await supabase
      .from("asset_history")
      .select("*")
      .eq("asset_seq", assetSeq)
      .order("recorded_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => mapHistory(r as Record<string, unknown>));
  },
};

export default assetApi;
