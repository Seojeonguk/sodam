const GUEST_MODE_KEY = "sodam_guest_mode";

export const guestMode = {
  enable(): void {
    localStorage.setItem(GUEST_MODE_KEY, "1");
  },

  disable(): void {
    localStorage.removeItem(GUEST_MODE_KEY);
  },

  isActive(): boolean {
    return localStorage.getItem(GUEST_MODE_KEY) === "1";
  },

  /** 게스트 관련 모든 localStorage 데이터 삭제 */
  clearAll(): void {
    const keysToRemove = Object.keys(localStorage).filter(
      (k) =>
        k.startsWith("sodam_guest_") ||
        k === GUEST_MODE_KEY,
    );
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  },
};
