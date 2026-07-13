import { useEffect, useState } from "react";
import api from "../api/api";
import { offlineQueue } from "./offlineQueue";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(offlineQueue.size());

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);

      const queueSize = offlineQueue.size();
      if (queueSize === 0) return;

      console.log(`[Offline] 재연결 감지. 큐 동기화 시작 (${queueSize}건)`);
      const { synced, failed } = await api.syncOfflineQueue();
      console.log(`[Offline] 동기화 완료: 성공 ${synced}, 실패 ${failed}`);
      setPendingCount(offlineQueue.size());
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
