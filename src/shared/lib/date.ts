import type { Dayjs } from "dayjs";

/** Dayjs 객체를 서버 API가 기대하는 YYYYMMDD 날짜 키 문자열로 변환 */
export const toDateKey = (d: Dayjs): string => d.format("YYYYMMDD");
