export const formatCurrency = (value: number): string =>
  `${value.toLocaleString("ko-KR")}원`;

/** 큰 금액을 만/억 단위로 압축 표시 (차트 chip 등 공간이 좁은 곳 전용) */
export const formatCompactCurrency = (value: number): string => {
  if (value >= 100_000_000) {
    const eok = value / 100_000_000;
    return `${eok % 1 === 0 ? eok.toFixed(0) : eok.toFixed(1)}억원`;
  }
  if (value >= 10_000) {
    const man = Math.floor(value / 10_000);
    return `${man.toLocaleString("ko-KR")}만원`;
  }
  return formatCurrency(value);
};
