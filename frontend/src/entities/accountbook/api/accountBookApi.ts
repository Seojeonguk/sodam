import api from "../../../shared/api/api";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../../shared/lib/guestStore";
import type { AccountBookListResponse } from "./accountbook.types";

const ACCOUNT_BOOK_BASE_URL = "/account-books";

const accountBookApi = {
  getAccountBooks: async (): Promise<AccountBookListResponse[]> => {
    if (guestMode.isActive()) return guestStore.getAccountBooks();
    return api.get<AccountBookListResponse[]>(ACCOUNT_BOOK_BASE_URL);
  },
};

export default accountBookApi;
