import api from "../../../shared/api/api";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../../shared/lib/guestStore";
import type {
  StatPeriodRequest,
  StatPeriodResponse,
  StatRequest,
  StatResponse,
} from "./stat.types";

const STAT_BASE_URL = "/stat";

const statApi = {
  getStats: async (data: StatRequest): Promise<StatResponse[]> => {
    if (guestMode.isActive()) return guestStore.getStats(data.startDate, data.endDate, data.categorySeqs);
    return api.get<StatResponse[]>(STAT_BASE_URL, { params: data, paramsSerializer: { indexes: null } });
  },

  getPeriodStats: async (
    request: StatPeriodRequest,
  ): Promise<StatPeriodResponse[]> => {
    if (guestMode.isActive()) return guestStore.getPeriodStats(request.startDate, request.endDate, request.categorySeqs);
    return api.get<StatPeriodResponse[]>(`${STAT_BASE_URL}/period`, {
      params: request,
      paramsSerializer: { indexes: null },
    });
  },
};

export default statApi;
