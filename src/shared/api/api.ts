import { sessionCache } from "../lib/localCache";
import { supabase } from "../lib/supabase";

let accessToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const clearAccessToken = (): void => {
  setAccessToken(null);
};

/** Supabase 세션에서 토큰을 갱신 */
export async function refreshSupabaseToken(): Promise<string> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) {
    throw new Error("Supabase 세션 갱신 실패");
  }
  const newToken = data.session.access_token;
  setAccessToken(newToken);
  return newToken;
}

/** 오프라인 전용 플레이스홀더 토큰 */
const OFFLINE_TOKEN = "__offline__";

export function isOfflineToken(): boolean {
  return accessToken === OFFLINE_TOKEN;
}

/** 앱 초기화 시 Supabase 세션 복구 */
export async function restoreSession(): Promise<boolean> {
  // 오프라인이고 이전 세션이 있으면 → 오프라인 통과
  if (!navigator.onLine) {
    const session = sessionCache.get();
    if (session) {
      setAccessToken(OFFLINE_TOKEN);
      console.warn("[Offline] 캐시 세션으로 오프라인 접속 허용");
      return true;
    }
    return false;
  }

  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      setAccessToken(data.session.access_token);
      sessionCache.set(data.session.user.email ?? "");
      return true;
    }
    return false;
  } catch {
    clearAccessToken();
    return false;
  }
}

// Supabase 세션 변경 시 토큰 자동 동기화
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.access_token) {
    setAccessToken(session.access_token);
    sessionCache.set(session.user.email ?? "");
  } else if (event === "SIGNED_OUT") {
    clearAccessToken();
    sessionCache.clear();
  }
});
