import api from "../../../shared/api/api";
import type {
  StatPeriodRequest,
  StatPeriodResponse,
  StatRequest,
  StatResponse,
} from "./stat.types";
import type { CommonResponse } from "../../../shared/api/response.types";

const STAT_BASE_URL = "/stat";

const statApi = {
  getStats: async (data: StatRequest): Promise<CommonResponse<StatResponse[]>> => {
    const response = (await api.get<CommonResponse<StatResponse[]>>(
      STAT_BASE_URL,
      {
        params: data,
      }
    )) as unknown as CommonResponse<StatResponse[]>;
    return response;
  },
  getPeriodStats: async (
    req: StatPeriodRequest
  ): Promise<CommonResponse<StatPeriodResponse[]>> => {
    const response = (await api.get<CommonResponse<StatPeriodResponse[]>>(
      `${STAT_BASE_URL}/period`,
      { params: req }
    )) as unknown as CommonResponse<StatPeriodResponse[]>;
    return response;
  },
};

export default statApi;
