import api from "../../../utils/api";
import type {
  TransactionListResponse,
  TransactionCreateRequestDto,
  TransactionResponseDto,
  TransactionUpdateRequestDto,
} from "./transaction.types";

const TRANSACTION_BASE_URL = "/transactions";

const transactionApi = {
  // 거래 목록 조회
  getTransactions: async (): Promise<TransactionListResponse> => {
    const response =
      await api.get<TransactionListResponse>(TRANSACTION_BASE_URL);
    return response.data;
  },

  // 거래 생성
  createTransaction: async (
    data: TransactionCreateRequestDto,
  ): Promise<TransactionResponseDto> => {
    const response = await api.post<TransactionResponseDto>(
      TRANSACTION_BASE_URL,
      data,
    );
    return response.data;
  },

  getTransactionBySeq: async (
    seq: number | null,
  ): Promise<TransactionResponseDto> => {
    const response = await api.get<TransactionResponseDto>(
      `${TRANSACTION_BASE_URL}/${seq}`,
    );
    return response.data;
  },

  updateTransaction: async (
    seq: number,
    data: TransactionUpdateRequestDto,
  ): Promise<TransactionResponseDto> => {
    const response = await api.put<TransactionResponseDto>(
      `${TRANSACTION_BASE_URL}/${seq}`,
      data,
    );
    return response.data;
  },

  deleteTransaction: async (seq: number): Promise<void> => {
    await api.delete(`${TRANSACTION_BASE_URL}/${seq}`);
  },
};

export default transactionApi;
