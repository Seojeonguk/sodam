export type MemberAuthority = "OWNER" | "EDITOR" | "VIEWER";

export interface MemberResponse {
  userId: number;
  email: string;
  name: string;
  imageUrl?: string;
  authority: MemberAuthority;
  joinedAt: string;
}

export interface MemberInviteRequest {
  email: string;
  authority: "EDITOR" | "VIEWER";
}

export interface MemberAuthorityUpdateRequest {
  authority: "EDITOR" | "VIEWER";
}

/** memberApi.invite() 반환 타입 */
export interface InviteResult {
  /**
   * added       : public.users에 있음 → 즉시 멤버 추가
   * pending_auth: auth.users에는 있지만 아직 앱 미접속(public.users 미동기화)
   *               → pending_invite 생성, 다음 로그인 시 자동 추가
   * pending_signup: auth.users에도 없음 → 미가입 유저, 초대 링크 공유 필요
   */
  status: "added" | "pending_auth" | "pending_signup";
  member?: MemberResponse;
  /** pending_signup 상태일 때 초대 토큰 (UUID) */
  inviteToken?: string;
  /** pending 상태일 때 초대된 이메일 */
  inviteEmail?: string;
}
