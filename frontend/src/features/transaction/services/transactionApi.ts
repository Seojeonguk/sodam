import api from "../../../utils/api";
import type { TransactionListResponseDto } from "./transaction.types";

const TRANSACTION_BASE_URL = "/transactions";

const transactionApi = {
  // 거래 목록 조회
  getTransactions: async (): Promise<TransactionListResponseDto> => {
    const response =
      await api.get<TransactionListResponseDto>(TRANSACTION_BASE_URL);
    return response.data;
  },
};

export default transactionApi;
