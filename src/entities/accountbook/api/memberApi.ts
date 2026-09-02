import dayjs from "dayjs";
import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
import type {
  InviteResult,
  MemberAuthorityUpdateRequest,
  MemberInviteRequest,
  MemberResponse,
} from "./member.types";

function mapMember(row: Record<string, unknown>): MemberResponse {
  const user = row.user as Record<string, unknown>;
  return {
    userId: row.user_id as number,
    email: user.email as string,
    name: user.name as string,
    imageUrl: user.image_url as string | undefined,
    authority: row.authority as MemberResponse["authority"],
    joinedAt: row.created_at as string,
  };
}

const memberApi = {
  getMembers: async (accountBookId: number): Promise<MemberResponse[]> => {
    const { data, error } = await supabase
      .from("account_book_member")
      .select(
        `
        user_id,
        authority,
        created_at,
        user:user_id (
          email,
          name,
          image_url
        )
      `,
      )
      .eq("account_book_id", accountBookId);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => mapMember(row as Record<string, unknown>));
  },

  invite: async (
    accountBookId: number,
    data: MemberInviteRequest,
  ): Promise<InviteResult> => {
    const mySeq = await getUserSeq();
    const now = dayjs().format("YYYYMMDDHHmmss");

    // ── 1단계: public.users 조회 ──
    const { data: targetUser, error: userErr } = await supabase
      .from("users")
      .select("id, email, name, image_url")
      .eq("email", data.email)
      .maybeSingle();

    if (userErr) throw new Error(userErr.message);

    // ── 기존 가입자(앱 동기화 완료): 즉시 멤버 추가 ──
    if (targetUser) {
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

      if (memberErr || !member)
        throw new Error(memberErr?.message ?? "초대 실패");

      return {
        status: "added",
        member: {
          userId: targetUser.id as number,
          email: targetUser.email as string,
          name: targetUser.name as string,
          imageUrl: targetUser.image_url as string | undefined,
          authority: member.authority as MemberResponse["authority"],
          joinedAt: member.created_at as string,
        },
      };
    }

    // ── 2단계: public.users에 없으면 auth.users 확인 ──
    // (카카오 등 소셜 로그인은 했지만 아직 앱에 한 번도 접속 안 한 경우)
    const { data: authExists } = await supabase.rpc("check_auth_user_exists", {
      p_email: data.email,
    });

    // pending_invite 공통 생성
    const expires = dayjs().add(7, "day").format("YYYYMMDDHHmmss");
    const { data: invite, error: inviteErr } = await supabase
      .from("pending_invites")
      .insert({
        account_book_id: accountBookId,
        invited_email: data.email,
        authority: data.authority,
        invited_by: mySeq,
        created_at: now,
        expires_at: expires,
      })
      .select("id")
      .single();

    if (inviteErr || !invite)
      throw new Error(inviteErr?.message ?? "초대 생성 실패");

    if (authExists) {
      // 소셜 로그인 가입자이지만 앱 미접속 → 다음 로그인 시 자동 처리
      return {
        status: "pending_auth",
        inviteEmail: data.email,
      };
    }

    // 완전 미가입 → 초대 링크 공유 필요
    return {
      status: "pending_signup",
      inviteToken: invite.id as string,
      inviteEmail: data.email,
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

  removeMember: async (
    accountBookId: number,
    userId: number,
  ): Promise<void> => {
    const { error } = await supabase
      .from("account_book_member")
      .delete()
      .eq("account_book_id", accountBookId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  },
};

export default memberApi;
