import { useCallback, useEffect, useState } from "react";
import memberStatApi, { type MemberStatData } from "../api/memberStatApi";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

export const useMemberStats = (
  accountBookId: number | null,
  year: number,
) => {
  const [members, setMembers] = useState<MemberStatData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!accountBookId) {
      setMembers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setMembers(await memberStatApi.getMemberYearStats(accountBookId, year));
    } catch (e) {
      setError(
        getServerErrorMessage(e, "멤버 통계를 불러오는 중 오류가 발생했습니다."),
      );
    } finally {
      setLoading(false);
    }
  }, [accountBookId, year]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { members, loading, error, refresh: fetch };
};
