import { useEffect, useState } from "react";
import { isOfflineToken, refreshSupabaseToken } from "../api/api";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  return { isOnline };
}
