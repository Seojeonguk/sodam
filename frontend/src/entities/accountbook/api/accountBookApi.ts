import api from "../../../shared/api/api";
import type { AccountBookListResponse } from "./accountbook.types";

const ACCOUNT_BOOK_BASE_URL = "/account-books";

const accountBookApi = {
  getAccountBooks: async (): Promise<AccountBookListResponse[]> =>
    api.get<AccountBookListResponse[]>(ACCOUNT_BOOK_BASE_URL),
};

export default accountBookApi;
