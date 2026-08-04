import dayjs from "dayjs";
import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
import type {
  MemberAuthorityUpdateRequest,
  MemberInviteRequest,
  MemberResponse,
} from "./member.types";

const memberApi = {
  getMembers: async (accountBookId: number): Promise<MemberResponse[]> => {
    const { data, error } = await supabase
      .from("account_book_member")
      .select(`
        user_id,
        authority,
        created_at,
        user:user_id (
          email,
          name,
          image_url
        )
      `)
      .eq("account_book_id", accountBookId);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      userId: row.user_id as number,
      email: row.user.email as string,
      name: row.user.name as string,
      imageUrl: row.user.image_url as string | undefined,
      authority: row.authority as MemberResponse["authority"],
      joinedAt: row.created_at as string,
    }));
  },

  invite: async (
    accountBookId: number,
    data: MemberInviteRequest,
  ): Promise<MemberResponse> => {
    // 초대할 유저 조회
    const { data: targetUser, error: userErr } = await supabase
      .from("users")
      .select("id, email, name, image_url")
      .eq("email", data.email)
      .maybeSingle();

    if (userErr) throw new Error(userErr.message);
    if (!targetUser) throw new Error("해당 이메일의 사용자를 찾을 수 없습니다.");

    const mySeq = await getUserSeq();
    const now = dayjs().format("YYYYMMDDHHmmss");

    const { data: member, error: memberErr } = await supabase
      .from("account_book_member")
      .insert({
        account_book_id: accountBookId,
        user_id: targetUser.id,
        authority: data.authority,
        is_available: "Y",
        created_at: now,
        created_by: mySeq,
        updated_at: now,
        updated_by: mySeq,
      })
      .select("authority, created_at")
      .single();

    if (memberErr || !member) throw new Error(memberErr?.message ?? "초대 실패");

    return {
      userId: targetUser.id as number,
      email: targetUser.email as string,
      name: targetUser.name as string,
      imageUrl: targetUser.image_url as string | undefined,
      authority: member.authority as MemberResponse["authority"],
      joinedAt: member.created_at as string,
    };
  },

  updateAuthority: async (
    accountBookId: number,
    userId: number,
    data: MemberAuthorityUpdateRequest,
  ): Promise<MemberResponse> => {
    const now = dayjs().format("YYYYMMDDHHmmss");

    const { error } = await supabase
      .from("account_book_member")
      .update({ authority: data.authority, updated_at: now })
      .eq("account_book_id", accountBookId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);

    // 업데이트된 멤버 반환
    const members = await memberApi.getMembers(accountBookId);
    const updated = members.find((m) => m.userId === userId);
    if (!updated) throw new Error("멤버를 찾을 수 없습니다.");
    return updated;
  },

  removeMember: async (accountBookId: number, userId: number): Promise<void> => {
    const { error } = await supabase
      .from("account_book_member")
      .delete()
      .eq("account_book_id", accountBookId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  },
};

export default memberApi;
