import api from "../../../shared/api/api";
import type {
  MemberAuthorityUpdateRequest,
  MemberInviteRequest,
  MemberResponse,
} from "./member.types";

const base = (accountBookId: number) => `/account-books/${accountBookId}/members`;

const memberApi = {
  getMembers: (accountBookId: number): Promise<MemberResponse[]> =>
    api.get<MemberResponse[]>(base(accountBookId)),

  invite: (accountBookId: number, data: MemberInviteRequest): Promise<MemberResponse> =>
    api.post<MemberResponse, MemberInviteRequest>(base(accountBookId), data),

  updateAuthority: (
    accountBookId: number,
    userId: number,
    data: MemberAuthorityUpdateRequest,
  ): Promise<MemberResponse> =>
    api.patch<MemberResponse, MemberAuthorityUpdateRequest>(`${base(accountBookId)}/${userId}`, data),

  removeMember: (accountBookId: number, userId: number): Promise<void> =>
    api.delete(`${base(accountBookId)}/${userId}`),
};

export default memberApi;
