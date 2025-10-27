import api from "../../../utils/api";
import type { StatRequest, StatResponse } from "./stat.types";

const STAT_BASE_URL = "/stat";

const statApi = {
  getStats: async (data: StatRequest): Promise<StatResponse> => {
    const response = await api.get<StatResponse>(STAT_BASE_URL, { data: data });
    return response.data;
  },
};

export default statApi;
