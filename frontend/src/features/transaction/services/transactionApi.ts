import api from "../../../utils/api";
import type {
  TransactionListResponseDto,
  TransactionCreateRequestDto,
  TransactionResponseDto,
} from "./transaction.types";

const TRANSACTION_BASE_URL = "/transactions";

const transactionApi = {
  // 거래 목록 조회
  getTransactions: async (): Promise<TransactionListResponseDto> => {
    const response =
      await api.get<TransactionListResponseDto>(TRANSACTION_BASE_URL);
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
};

export default transactionApi;
