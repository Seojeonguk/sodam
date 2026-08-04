import { supabase } from "../../../shared/lib/supabase";
import { guestMode } from "../../../shared/lib/guestMode";
import type { ClassificationResponse } from "./classification.types";

const FALLBACK: ClassificationResponse[] = [
  { id: 1, name: "INCOME" },
  { id: 2, name: "EXPENSE" },
];

const classificationApi = {
  getClassifications: async (
    accountBookSeq: number,
  ): Promise<ClassificationResponse[]> => {
    if (guestMode.isActive()) return FALLBACK;

    const { data, error } = await supabase
      .from("classification")
      .select("id, name")
      .eq("account_book_seq", accountBookSeq);

    if (error) throw new Error(error.message);

    // DB에 데이터가 없으면 기본값 반환
    return data && data.length > 0
      ? data.map((r: any) => ({ id: r.id as number, name: r.name as string }))
      : FALLBACK;
  },
};

export default classificationApi;
