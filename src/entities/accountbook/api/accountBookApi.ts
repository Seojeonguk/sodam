import dayjs from "dayjs";
import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq, seedAccountBookDefaults } from "../../../shared/lib/userSync";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../guest/lib/guestStore";
import type { AccountBookListResponse } from "./accountbook.types";

export interface AccountBookCreateResponse {
  id: number;
  name: string;
  updatedAt: string;
}

const accountBookApi = {
  getAccountBooks: async (): Promise<AccountBookListResponse[]> => {
    if (guestMode.isActive()) return guestStore.getAccountBooks();

    const userSeq = await getUserSeq();

    const { data, error } = await supabase
      .from("account_book_member")
      .select(`
        authority,
        account_book:account_book_id (
          id,
          name
        )
      `)
      .eq("user_id", userSeq);

    if (error) throw new Error(error.message);

    // account_book_member에 동일 (account_book_id, user_id) 중복 행이 있어도
    // 목록에는 가계부당 한 번만 노출되도록 방어
    const seen = new Set<number>();
    const result: AccountBookListResponse[] = [];
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      const accountBook = row.account_book as Record<string, unknown>;
      const id = accountBook.id as number;
      if (seen.has(id)) continue;
      seen.add(id);
      result.push({
        id,
        name: accountBook.name as string,
        isOwner: row.authority === "OWNER",
        canEdit: row.authority === "OWNER" || row.authority === "EDITOR",
      });
    }
    return result;
  },

  createAccountBook: async (
    name: string,
    opts?: { seedDefaultCategories?: boolean },
  ): Promise<AccountBookCreateResponse> => {
    const userSeq = await getUserSeq();
    const now = dayjs().format("YYYYMMDDHHmmss");

    const { data: book, error: bookErr } = await supabase
      .from("account_book")
      .insert({
        name,
        created_at: now,
        created_by: userSeq,
        updated_at: now,
        updated_by: userSeq,
      })
      .select("id, name, updated_at")
      .single();

    if (bookErr || !book) throw new Error(bookErr?.message ?? "가계부 생성 실패");

    await supabase.from("account_book_member").insert({
      account_book_id: book.id,
      user_id: userSeq,
      authority: "OWNER",
      is_available: "Y",
      created_at: now,
      created_by: userSeq,
      updated_at: now,
      updated_by: userSeq,
    });

    await seedAccountBookDefaults(book.id as number, userSeq, {
      includeCategories: opts?.seedDefaultCategories ?? true,
    });

    return {
      id: book.id as number,
      name: book.name as string,
      updatedAt: book.updated_at as string,
    };
  },

  deleteAccountBook: async (id: number): Promise<void> => {
    const { error } = await supabase.rpc("delete_account_book", {
      p_account_book_id: id,
    });

    if (error) throw new Error(error.message);
  },
};

export default accountBookApi;
