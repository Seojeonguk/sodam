import { useCallback, useEffect, useState } from "react";
import assetApi from "../api/assetApi";
import type {
  AssetCreateRequest,
  AssetHistoryResponse,
  AssetResponse,
  AssetUpdateRequest,
} from "../api/asset.types";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

export const useAssets = (accountBookId: number | null) => {
  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accountBookId) { setAssets([]); return; }
    setLoading(true);
    setError(null);
    try {
      setAssets(await assetApi.getAssets(accountBookId));
    } catch (e) {
      setError(getServerErrorMessage(e, "자산 목록을 불러오는 중 오류가 발생했습니다."));
    } finally {
      setLoading(false);
    }
  }, [accountBookId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createAsset = useCallback(
    async (req: AssetCreateRequest) => {
      if (!accountBookId) return;
      const created = await assetApi.createAsset(accountBookId, req);
      setAssets((prev) => [...prev, created]);
    },
    [accountBookId],
  );

  const updateAsset = useCallback(
    async (seq: number, req: AssetUpdateRequest) => {
      const updated = await assetApi.updateAsset(seq, req);
      setAssets((prev) => prev.map((a) => (a.seq === seq ? updated : a)));
    },
    [],
  );

  const deleteAsset = useCallback(async (seq: number) => {
    await assetApi.deleteAsset(seq);
    setAssets((prev) => prev.filter((a) => a.seq !== seq));
  }, []);

  const recordBalance = useCallback(
    async (assetSeq: number, balance: number, note?: string) => {
      await assetApi.recordBalance(assetSeq, balance, note);
      setAssets((prev) =>
        prev.map((a) => (a.seq === assetSeq ? { ...a, balance } : a)),
      );
    },
    [],
  );

  return { assets, loading, error, refresh, createAsset, updateAsset, deleteAsset, recordBalance };
};

export const useAssetHistory = (assetSeq: number | null) => {
  const [history, setHistory] = useState<AssetHistoryResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!assetSeq) { setHistory([]); return; }
    setLoading(true);
    try {
      setHistory(await assetApi.getHistory(assetSeq));
    } finally {
      setLoading(false);
    }
  }, [assetSeq]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { history, loading, refresh: fetch };
};
