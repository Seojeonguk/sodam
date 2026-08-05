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
  /** added: 기존 유저로 즉시 추가, pending: 미가입 유저 초대 보류 */
  status: "added" | "pending";
  member?: MemberResponse;
  /** pending 상태일 때 초대 토큰 (UUID) */
  inviteToken?: string;
  /** pending 상태일 때 초대된 이메일 */
  inviteEmail?: string;
}
