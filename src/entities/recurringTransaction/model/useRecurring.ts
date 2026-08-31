import { useCallback, useEffect, useState } from "react";
import recurringApi from "../api/recurringApi";
import type { RecurringTransactionRequest, RecurringTransactionResponse } from "../api/recurring.types";
import { useAccountBookContext } from "../../accountbook/model/AccountBookContext";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

export const useRecurring = () => {
  const { currentAccountBook } = useAccountBookContext();
  const accountBookSeq = currentAccountBook?.id ?? null;

  const [list, setList] = useState<RecurringTransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accountBookSeq) { setList([]); return; }
    setLoading(true);
    setError(null);
    try {
      setList(await recurringApi.getList(accountBookSeq));
    } catch (e) {
      setError(getServerErrorMessage(e, "반복 거래 목록을 불러오는 중 오류가 발생했습니다."));
    } finally {
      setLoading(false);
    }
  }, [accountBookSeq]);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (data: RecurringTransactionRequest) => {
    const created = await recurringApi.create(data);
    setList((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: number, data: RecurringTransactionRequest) => {
    const updated = await recurringApi.update(id, data);
    setList((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }, []);

  const toggle = useCallback(async (id: number) => {
    const updated = await recurringApi.toggle(id);
    setList((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }, []);

  const remove = useCallback(async (id: number) => {
    await recurringApi.delete(id);
    setList((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { list, loading, error, refresh, create, update, toggle, remove, accountBookSeq };
};
