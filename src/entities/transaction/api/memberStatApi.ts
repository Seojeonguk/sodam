import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";

export interface MemberStatData {
  userId: number;
  userName: string;
  userEmail: string;
  imageUrl?: string;
  /** 12개월 BarChart 용 데이터셋 (period: "1월"~"12월", 타입키 lowercase) */
  dataset: Record<string, string | number>[];
  /** 연간 합계 (lowercase 타입키) */
  yearTotals: Record<string, number>;
  /** 발견된 분류 타입명 (UPPERCASE), e.g. ["INCOME","EXPENSE"] */
  types: string[];
}

const memberStatApi = {
  /**
   * 가계부 내 멤버별 연간 월별 통계 반환
   * FK 관계가 스키마 캐시에 없으므로 transaction 조회 후 users 별도 조회
   */
  getMemberYearStats: async (
    accountBookId: number,
    year: number,
  ): Promise<MemberStatData[]> => {
    await getUserSeq();

    const startDate = `${year}0101000000`;
    const endDate = `${year}1231235959`;

    // ── 1차: 트랜잭션 rows (join 없이) ──
    const { data: txRows, error: txErr } = await supabase
      .from("transaction")
      .select("amount, type, transaction_date, user_seq")
      .eq("account_book_seq", accountBookId)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate);

    if (txErr) throw new Error(txErr.message);
    const rows = txRows ?? [];

    // userId → month(1-12) → typeLower → total
    const agg = new Map<number, Map<number, Map<string, number>>>();
    const allTypesSet = new Set<string>();

    for (const row of rows) {
      const userId = row.user_seq as number;
      const month = parseInt(
        (row.transaction_date as string).substring(4, 6),
        10,
      );
      const typeUpper = (row.type as string).toUpperCase();
      const typeLower = (row.type as string).toLowerCase();
      allTypesSet.add(typeUpper);

      if (!agg.has(userId)) agg.set(userId, new Map());
      const monthMap = agg.get(userId)!;
      if (!monthMap.has(month)) monthMap.set(month, new Map());
      const typeMap = monthMap.get(month)!;
      typeMap.set(typeLower, (typeMap.get(typeLower) ?? 0) + Number(row.amount));
    }

    if (agg.size === 0) return [];

    // ── 2차: users 테이블에서 이름·이메일 조회 ──
    const userIds = Array.from(agg.keys());
    const { data: userRows, error: userErr } = await supabase
      .from("users")
      .select("id, name, email, image_url")
      .in("id", userIds);

    if (userErr) throw new Error(userErr.message);

    const userInfoMap = new Map<
      number,
      { name: string; email: string; imageUrl?: string }
    >();
    for (const u of userRows ?? []) {
      userInfoMap.set(u.id as number, {
        name: (u.name as string) ?? "알 수 없음",
        email: (u.email as string) ?? "",
        imageUrl: (u.image_url as string | null) ?? undefined,
      });
    }

    const allTypes = Array.from(allTypesSet);

    return Array.from(agg.entries()).map(([userId, monthMap]) => {
      const info = userInfoMap.get(userId) ?? {
        name: `사용자 ${userId}`,
        email: "",
        imageUrl: undefined,
      };

      // 12개월 전부 생성 (데이터 없는 달도 0)
      const dataset: Record<string, string | number>[] = Array.from(
        { length: 12 },
        (_, i) => {
          const m = i + 1;
          const typeMap = monthMap.get(m) ?? new Map<string, number>();
          const entry: Record<string, string | number> = { period: `${m}월` };
          for (const t of allTypes) {
            entry[t.toLowerCase()] = typeMap.get(t.toLowerCase()) ?? 0;
          }
          return entry;
        },
      );

      // 연간 합계
      const yearTotals: Record<string, number> = {};
      monthMap.forEach((typeMap) => {
        typeMap.forEach((total, typeLower) => {
          yearTotals[typeLower] = (yearTotals[typeLower] ?? 0) + total;
        });
      });

      return {
        userId,
        userName: info.name,
        userEmail: info.email,
        imageUrl: info.imageUrl,
        dataset,
        yearTotals,
        types: allTypes,
      };
    });
  },
};

export default memberStatApi;
