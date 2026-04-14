import api from "../../../shared/api/api";
import type {
  StatPeriodRequest,
  StatPeriodResponse,
  StatRequest,
  StatResponse,
} from "./stat.types";

const STAT_BASE_URL = "/stat";

const statApi = {
  getStats: async (data: StatRequest): Promise<StatResponse[]> => {
    const response = (await api.get<StatResponse[]>(
      STAT_BASE_URL,
      {
        params: data,
      },
    )) as StatResponse[];

    return response;
  },

  getPeriodStats: async (
    req: StatPeriodRequest,
  ): Promise<StatPeriodResponse[]> => {
    const response = (await api.get<StatPeriodResponse[]>(
      `${STAT_BASE_URL}/period`,
      { params: req },
    )) as StatPeriodResponse[];

    return response;
  },
};

export default statApi;
