import api from "../../../shared/api/api";
import type { AccountBookListResponse } from "./accountbook.types";
import type { CommonResponse } from "../../../shared/api/response.types";

const ACCOUNT_BOOK_BASE_URL = "/account-books";

const accountBookApi = {
  getAccountBooks: async (): Promise<CommonResponse<AccountBookListResponse[]>> => {
    const response = (await api.get<CommonResponse<AccountBookListResponse[]>>(
      ACCOUNT_BOOK_BASE_URL
    )) as unknown as CommonResponse<AccountBookListResponse[]>;
    return response;
  },
};

export default accountBookApi;
