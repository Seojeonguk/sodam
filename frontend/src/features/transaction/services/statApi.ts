import api from "../../../utils/api";
import type {
  StatPeriodRequest,
  StatPeriodResponse,
  StatRequest,
  StatResponse,
} from "./stat.types";

const STAT_BASE_URL = "/stat";

const statApi = {
  getStats: async (data: StatRequest): Promise<Array<StatResponse>> => {
    const response = await api.get<Array<StatResponse>>(STAT_BASE_URL, {
      data: data,
    });
    return response.data;
  },
  getPeriodStats: async (
    req: StatPeriodRequest,
  ): Promise<Array<StatPeriodResponse>> => {
    const response = await api.get<Array<StatPeriodResponse>>(
      `${STAT_BASE_URL}/period`,
      { data: req },
    );
    return response.data;
  },
};

export default statApi;
