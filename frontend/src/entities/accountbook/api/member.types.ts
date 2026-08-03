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
