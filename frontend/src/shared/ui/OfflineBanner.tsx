interface OfflineBannerProps {
  pendingCount: number;
}

export function OfflineBanner({ pendingCount }: OfflineBannerProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "#f59e0b",
        color: "#1c1917",
        textAlign: "center",
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: 500,
      }}
    >
      ⚠️ 오프라인 상태입니다. 캐시 데이터를 표시 중
      {pendingCount > 0 && ` — 대기 중인 작업 ${pendingCount}건`}
    </div>
  );
}
