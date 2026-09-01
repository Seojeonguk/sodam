const SESSION_KEY = "sodam_session";

export interface SessionInfo {
  email: string;
  name?: string;
  savedAt: number;
}

export const sessionCache = {
  set(email: string, name?: string): void {
    try {
      const info: SessionInfo = { email, name, savedAt: Date.now() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(info));
    } catch {
      // 무시
    }
  },

  get(): SessionInfo | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as SessionInfo) : null;
    } catch {
      return null;
    }
  },

  clear(): void {
    localStorage.removeItem(SESSION_KEY);
  },
};
