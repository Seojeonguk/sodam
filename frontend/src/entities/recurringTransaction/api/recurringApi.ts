import api from "../../../shared/api/api";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../../shared/lib/guestStore";
import type { RecurringTransactionRequest, RecurringTransactionResponse } from "./recurring.types";

const BASE = "/recurring-transactions";

const recurringApi = {
  getList: async (accountBookSeq: number): Promise<RecurringTransactionResponse[]> => {
    if (guestMode.isActive()) return guestStore.getRecurringList(accountBookSeq);
    return api.get<RecurringTransactionResponse[]>(BASE, { params: { accountBookSeq } });
  },

  create: async (data: RecurringTransactionRequest): Promise<RecurringTransactionResponse> => {
    if (guestMode.isActive()) return guestStore.createRecurring(data);
    return api.post<RecurringTransactionResponse, RecurringTransactionRequest>(BASE, data);
  },

  update: async (id: number, data: RecurringTransactionRequest): Promise<RecurringTransactionResponse> => {
    if (guestMode.isActive()) return guestStore.updateRecurring(id, data);
    return api.put<RecurringTransactionResponse, RecurringTransactionRequest>(`${BASE}/${id}`, data);
  },

  toggle: async (id: number): Promise<RecurringTransactionResponse> => {
    if (guestMode.isActive()) return guestStore.toggleRecurring(id);
    return api.patch<RecurringTransactionResponse>(`${BASE}/${id}/toggle`);
  },

  delete: async (id: number): Promise<void> => {
    if (guestMode.isActive()) { guestStore.deleteRecurring(id); return; }
    await api.delete(`${BASE}/${id}`);
  },
};

export default recurringApi;
