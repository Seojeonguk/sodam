import api from "../../../shared/api/api";
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
  ): Promise<TransactionListResponse> =>
    api.get<TransactionListResponse>(TRANSACTION_BASE_URL, {
      params: {
        accountBookSeq: accountId,
        startDate,
        endDate,
      },
    }),

  createTransaction: async (
    data: TransactionCreateRequestDto,
  ): Promise<TransactionResponseDto> =>
    api.post<TransactionResponseDto, TransactionCreateRequestDto>(
      TRANSACTION_BASE_URL,
      data,
    ),

  getTransactionBySeq: async (
    seq: number | null,
  ): Promise<TransactionResponseDto> =>
    api.get<TransactionResponseDto>(`${TRANSACTION_BASE_URL}/${seq}`),

  updateTransaction: async (
    seq: number,
    data: TransactionUpdateRequestDto,
  ): Promise<TransactionResponseDto> =>
    api.put<TransactionResponseDto, TransactionUpdateRequestDto>(
      `${TRANSACTION_BASE_URL}/${seq}`,
      data,
    ),

  deleteTransaction: async (seq: number): Promise<void> => {
    await api.delete(`${TRANSACTION_BASE_URL}/${seq}`);
  },
};

export default transactionApi;
