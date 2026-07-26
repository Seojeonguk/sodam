import api from "../../../shared/api/api";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../../shared/lib/guestStore";
import type {
  TransactionCreateRequestDto,
  TransactionListResponse,
  TransactionResponseDto,
  TransactionUpdateRequestDto,
} from "./transaction.types";

const TRANSACTION_BASE_URL = "/transactions";

const transactionApi = {
  getTransactions: async (
    accountId: number,
    startDate?: string,
    endDate?: string,
    page = 0,
    size = 10,
    categorySeq?: number,
  ): Promise<TransactionListResponse> => {
    if (guestMode.isActive())
      return guestStore.getTransactions(
        accountId,
        startDate,
        endDate,
        page,
        size,
        categorySeq,
      );
    return api.get<TransactionListResponse>(TRANSACTION_BASE_URL, {
      params: { accountBookSeq: accountId, startDate, endDate, page, size, ...(categorySeq != null && { categorySeq }) },
    });
  },

  createTransaction: async (
    data: TransactionCreateRequestDto,
  ): Promise<TransactionResponseDto> => {
    if (guestMode.isActive()) return guestStore.createTransaction(data);
    return api.post<TransactionResponseDto, TransactionCreateRequestDto>(
      TRANSACTION_BASE_URL,
      data,
    );
  },

  getTransactionBySeq: async (
    seq: number | null,
  ): Promise<TransactionResponseDto> => {
    if (guestMode.isActive()) {
      const tx = guestStore.getTransactionBySeq(seq!);
      if (!tx) throw new Error("거래를 찾을 수 없습니다.");
      return tx;
    }
    return api.get<TransactionResponseDto>(`${TRANSACTION_BASE_URL}/${seq}`);
  },

  updateTransaction: async (
    seq: number,
    data: TransactionUpdateRequestDto,
  ): Promise<TransactionResponseDto> => {
    if (guestMode.isActive()) return guestStore.updateTransaction(seq, data);
    return api.put<TransactionResponseDto, TransactionUpdateRequestDto>(
      `${TRANSACTION_BASE_URL}/${seq}`,
      data,
    );
  },

  deleteTransaction: async (seq: number): Promise<void> => {
    if (guestMode.isActive()) {
      guestStore.deleteTransaction(seq);
      return;
    }
    await api.delete(`${TRANSACTION_BASE_URL}/${seq}`);
  },
};

export default transactionApi;
