import { useCallback, useEffect, useState } from "react";
import memberApi from "../api/memberApi";
import type {
  InviteResult,
  MemberAuthorityUpdateRequest,
  MemberInviteRequest,
  MemberResponse,
} from "../api/member.types";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

export const useMembers = (accountBookId: number | null) => {
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accountBookId) { setMembers([]); return; }
    setLoading(true);
    setError(null);
    try {
      setMembers(await memberApi.getMembers(accountBookId));
    } catch (e) {
      setError(getServerErrorMessage(e, "멤버 목록을 불러오는 중 오류가 발생했습니다."));
    } finally {
      setLoading(false);
    }
  }, [accountBookId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const invite = useCallback(async (data: MemberInviteRequest): Promise<InviteResult> => {
    if (!accountBookId) throw new Error("accountBookId가 없습니다.");
    const result = await memberApi.invite(accountBookId, data);
    if (result.status === "added" && result.member) {
      setMembers((prev) => [...prev, result.member!]);
    }
    return result;
  }, [accountBookId]);

  const updateAuthority = useCallback(async (userId: number, data: MemberAuthorityUpdateRequest) => {
    if (!accountBookId) return;
    const updated = await memberApi.updateAuthority(accountBookId, userId, data);
    setMembers((prev) => prev.map((m) => m.userId === userId ? updated : m));
  }, [accountBookId]);

  const remove = useCallback(async (userId: number) => {
    if (!accountBookId) return;
    await memberApi.removeMember(accountBookId, userId);
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  }, [accountBookId]);

  return { members, loading, error, refresh, invite, updateAuthority, remove };
};
