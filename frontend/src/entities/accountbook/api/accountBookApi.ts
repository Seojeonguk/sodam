import api from "../../../shared/api/api";
import type { AccountBookListResponse } from "./accountbook.types";

const ACCOUNT_BOOK_BASE_URL = "/account-books";

const accountBookApi = {
  getAccountBooks: async (): Promise<AccountBookListResponse[]> => {
    const response = await api.get<AccountBookListResponse[]>(
      ACCOUNT_BOOK_BASE_URL
    );
    return response.data;
  },
};

export default accountBookApi;
