import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
import { guestMode } from "../../../shared/lib/guestMode";
import type { ClassificationResponse } from "./classification.types";

const FALLBACK: ClassificationResponse[] = [
  { id: 1, name: "INCOME" },
  { id: 2, name: "EXPENSE" },
];

const classificationApi = {
  /**
   * RLS가 현재 유저의 가계부에 속한 분류만 반환.
   * accountBookSeq를 전달하면 해당 가계부로 추가 필터링.
   */
  getClassifications: async (
    accountBookSeq?: number | null,
  ): Promise<ClassificationResponse[]> => {
    if (guestMode.isActive()) return FALLBACK;

    await getUserSeq(); // 세션 유효성 확인

    let query = supabase
      .from("classification")
      .select("id, name, account_book_seq");

    if (accountBookSeq) {
      query = query.eq("account_book_seq", accountBookSeq);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return data && data.length > 0
      ? data.map((r) => ({
          id: r.id as number,
          name: r.name as "INCOME" | "EXPENSE" | "TRANSFER",
        }))
      : FALLBACK;
  },
};

export default classificationApi;
