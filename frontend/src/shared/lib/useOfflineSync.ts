import { useEffect, useState } from "react";
import api from "../api/api";
import { isOfflineToken, refreshSupabaseToken } from "../api/api";
import { offlineQueue } from "./offlineQueue";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(offlineQueue.size());

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);

      // 오프라인 토큰으로 접속 중이었다면 실제 토큰으로 교체
      if (isOfflineToken()) {
        try {
          await refreshSupabaseToken();
          console.log("[Offline] 재연결 후 세션 복구 성공");
        } catch {
          console.warn("[Offline] 재연결 후 세션 복구 실패 — 로그인 필요");
        }
      }

      // 오프라인 큐 동기화
      const queueSize = offlineQueue.size();
      if (queueSize > 0) {
        console.log(`[Offline] 큐 동기화 시작 (${queueSize}건)`);
        const { synced, failed } = await api.syncOfflineQueue();
        console.log(`[Offline] 동기화 완료: 성공 ${synced}, 실패 ${failed}`);
        setPendingCount(offlineQueue.size());
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // pendingCount 주기적 갱신
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingCount(offlineQueue.size());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return { isOnline, pendingCount };
}
