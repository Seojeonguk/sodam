import api from "../../../shared/api/api";
import type {
  StatPeriodRequest,
  StatPeriodResponse,
  StatRequest,
  StatResponse,
} from "./stat.types";

const STAT_BASE_URL = "/stat";

const statApi = {
  getStats: async (data: StatRequest): Promise<StatResponse[]> =>
    api.get<StatResponse[]>(STAT_BASE_URL, {
      params: data,
    }),

  getPeriodStats: async (
    request: StatPeriodRequest,
  ): Promise<StatPeriodResponse[]> =>
    api.get<StatPeriodResponse[]>(`${STAT_BASE_URL}/period`, {
      params: request,
    }),
};

export default statApi;
