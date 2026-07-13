const CACHE_PREFIX = "sodam_cache_";
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24시간

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttl: number;
}

export function buildCacheKey(url: string, params?: Record<string, unknown>): string {
  if (!params) return `${CACHE_PREFIX}${url}`;
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return `${CACHE_PREFIX}${url}?${sorted}`;
}

export const localCache = {
  set<T>(key: string, data: T, ttl = DEFAULT_TTL_MS): void {
    try {
      const entry: CacheEntry<T> = { data, cachedAt: Date.now(), ttl };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // localStorage 용량 초과 등 무시
    }
  },

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (Date.now() - entry.cachedAt > entry.ttl) {
        localStorage.removeItem(key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },

  delete(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },
};
