import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/ko";
import {
  AttachMoney,
  ChevronLeft,
  ChevronRight,
  CompareArrows,
  MoneyOff,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { formatCompactCurrency } from "../../../shared/lib/format";
import { useCalendarTransactions } from "../../../entities/transaction/model/useCalendarTransactions";
import { TYPE_MUI_COLOR, TYPE_SIGN } from "../../../entities/category/lib/classificationUtils";

dayjs.locale("ko");

// 월요일 시작 기준 요일 인덱스 (0=월 … 6=일)
const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

// 월요일 시작 기준 공백 셀 수
function getBlankCount(firstDay: Dayjs): number {
  const day = firstDay.day(); // 0=일, 1=월 … 6=토
  return (day + 6) % 7; // 월=0, 화=1 … 일=6
}

interface CalendarViewProps {
  onViewDetail: (seq: number) => void;
  categoryFilter?: number[];
}

export default function CalendarView({ onViewDetail, categoryFilter }: CalendarViewProps) {
  const theme = useTheme();
  const { month, setMonth, dayMap, loading } = useCalendarTransactions({ categorySeqs: categoryFilter });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = dayjs().format("YYYY-MM-DD");
  const firstDay = month.startOf("month");
  const daysInMonth = month.daysInMonth();
  const blanks = getBlankCount(firstDay);

  // 선택된 날짜의 거래 목록
  const selectedData = selectedDate ? (dayMap.get(selectedDate) ?? null) : null;

  const handlePrevMonth = () => {
    setMonth((m) => m.subtract(1, "month"));
    setSelectedDate(null);
  };
  const handleNextMonth = () => {
    setMonth((m) => m.add(1, "month"));
    setSelectedDate(null);
  };
  const handleSelectDay = (dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  };

  // 월 전체 분류별 합계
  const monthAmounts: Record<string, number> = {};
  for (const d of dayMap.values()) {
    for (const [type, v] of Object.entries(d.amounts)) {
      monthAmounts[type] = (monthAmounts[type] ?? 0) + v;
    }
  }

  return (
    <Box>
      {/* ── 월 헤더 ── */}
      <Paper
        elevation={0}
        sx={{ p: { xs: 2, sm: 2.5 }, mb: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
          <IconButton size="small" onClick={handlePrevMonth} sx={{ border: "1px solid", borderColor: "divider" }}>
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Stack alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              {month.format("YYYY년 M월")}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={140} height={16} />
            ) : (
              <Typography variant="caption" color="text.secondary">
                {Object.entries(monthAmounts).filter(([, v]) => v > 0).length === 0 && "거래 없음"}
                {Object.entries(monthAmounts)
                  .filter(([, v]) => v > 0)
                  .map(([type, v], i) => {
                    const muiColor = TYPE_MUI_COLOR[type] ?? "default";
                    const palKey = muiColor !== "default" ? muiColor : "primary";
                    const sign = TYPE_SIGN(type);
                    return (
                      <span key={type}>
                        {i > 0 && <Box component="span" color="text.disabled" mx={0.5}>·</Box>}
                        <Box component="span" color={`${palKey}.dark`} fontWeight={600}>
                          {sign}{formatCompactCurrency(v)}
                        </Box>
                      </span>
                    );
                  })
                }
              </Typography>
            )}
          </Stack>
          <IconButton size="small" onClick={handleNextMonth} sx={{ border: "1px solid", borderColor: "divider" }}>
            <ChevronRight fontSize="small" />
          </IconButton>
        </Stack>

        {/* 요일 헤더 */}
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5} mb={0.5}>
          {WEEKDAYS.map((d, i) => (
            <Typography
              key={d}
              variant="caption"
              fontWeight={700}
              textAlign="center"
              sx={{
                color: i === 5 ? "primary.main" : i === 6 ? "error.main" : "text.secondary",
                fontSize: "0.7rem",
                py: 0.5,
              }}
            >
              {d}
            </Typography>
          ))}
        </Box>

        {/* 날짜 셀 그리드 */}
        {loading ? (
          <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5}>
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" sx={{ height: { xs: 56, sm: 76 }, borderRadius: 1.5 }} />
            ))}
          </Box>
        ) : (
          <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5}>
            {/* 공백 셀 */}
            {Array.from({ length: blanks }).map((_, i) => (
              <Box key={`blank-${i}`} sx={{ height: { xs: 56, sm: 76 } }} />
            ))}

            {/* 날짜 셀 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const date = month.date(dayNum);
              const dateStr = date.format("YYYY-MM-DD");
              const data = dayMap.get(dateStr);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              // 월요일 시작 기준 컬럼 인덱스 (0=월 … 6=일)
              const colIndex = (blanks + i) % 7;
              const isSaturday = colIndex === 5;
              const isSunday = colIndex === 6;

              return (
                <Box
                  key={dateStr}
                  onClick={() => handleSelectDay(dateStr)}
                  sx={{
                    height: { xs: 56, sm: 76 },
                    p: { xs: "4px 5px", sm: "6px 8px" },
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: isSelected
                      ? "primary.main"
                      : data
                      ? "divider"
                      : "transparent",
                    bgcolor: isSelected
                      ? alpha(theme.palette.primary.main, 0.08)
                      : isToday
                      ? alpha(theme.palette.primary.main, 0.04)
                      : "transparent",
                    cursor: data ? "pointer" : "default",
                    transition: "all 0.15s ease",
                    "&:hover": data
                      ? { bgcolor: alpha(theme.palette.primary.main, 0.06), borderColor: "primary.light" }
                      : {},
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                >
                  {/* 날짜 숫자 */}
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Box
                      sx={
                        isToday
                          ? {
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }
                          : {}
                      }
                    >
                      <Typography
                        sx={{
                          fontSize: { xs: "0.7rem", sm: "0.8rem" },
                          fontWeight: isToday ? 800 : 500,
                          color: isToday
                            ? "primary.contrastText"
                            : isSunday
                            ? "error.main"
                            : isSaturday
                            ? "primary.main"
                            : "text.primary",
                          lineHeight: 1,
                        }}
                      >
                        {dayNum}
                      </Typography>
                    </Box>
                  </Box>

                  {data && (
                    <>
                      {/* 모바일: 분류별 컬러 점 */}
                      <Box sx={{ display: { xs: "flex", sm: "none" }, gap: 0.5, mt: "auto", justifyContent: "center" }}>
                        {Object.entries(data.amounts)
                          .filter(([, v]) => v > 0)
                          .map(([type]) => {
                            const mc = TYPE_MUI_COLOR[type] ?? "default";
                            return (
                              <Box key={type} sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: `${mc !== "default" ? mc : "primary"}.main` }} />
                            );
                          })}
                      </Box>

                      {/* 데스크톱: 분류별 금액 텍스트 */}
                      <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column", gap: 0.25, mt: "auto" }}>
                        {Object.entries(data.amounts)
                          .filter(([, v]) => v > 0)
                          .map(([type, v]) => {
                            const mc = TYPE_MUI_COLOR[type] ?? "default";
                            const pk = mc !== "default" ? mc : "primary";
                            return (
                              <Typography key={type} sx={{ fontSize: "0.6rem", fontWeight: 700, color: `${pk}.dark`, lineHeight: 1.2 }} noWrap>
                                {TYPE_SIGN(type)}{formatCompactCurrency(v)}
                              </Typography>
                            );
                          })}
                      </Box>
                    </>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* ── 선택된 날짜 거래 목록 ── */}
      {selectedDate && (
        <Paper
          elevation={0}
          sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
        >
          {/* 날짜 헤더 */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              {dayjs(selectedDate).format("M월 D일 (ddd)")}
            </Typography>
            {selectedData && (
              <Stack direction="row" spacing={1.5}>
                {Object.entries(selectedData.amounts)
                  .filter(([, v]) => v > 0)
                  .map(([type, v]) => {
                    const mc = TYPE_MUI_COLOR[type] ?? "default";
                    const pk = mc !== "default" ? mc : "primary";
                    return (
                      <Typography key={type} variant="caption" fontWeight={700} color={`${pk}.dark`}>
                        {TYPE_SIGN(type)}{formatCompactCurrency(v)}
                      </Typography>
                    );
                  })}
              </Stack>
            )}
          </Stack>

          {!selectedData ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.disabled">
                이 날의 거래 내역이 없습니다.
              </Typography>
            </Box>
          ) : (
            <>
              <Divider sx={{ mb: 1 }} />
              <List disablePadding>
                {selectedData.transactions.map((tx, idx) => {
                  const mc = TYPE_MUI_COLOR[tx.type] ?? "default";
                  const pk = mc !== "default" ? mc : "primary";
                  const sign = TYPE_SIGN(tx.type);
                  return (
                    <ListItem
                      key={tx.seq}
                      onClick={() => onViewDetail(tx.seq)}
                      divider={idx < selectedData.transactions.length - 1}
                      sx={{
                        px: 0,
                        py: 1,
                        cursor: "pointer",
                        borderRadius: 1,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.action.hover, 0.6),
                        },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 44 }}>
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: alpha(theme.palette[pk as "success" | "error" | "info" | "primary"].main, 0.12),
                            color: theme.palette[pk as "success" | "error" | "info" | "primary"].dark,
                          }}
                        >
                          {tx.type === "INCOME"
                            ? <AttachMoney sx={{ fontSize: "1rem" }} />
                            : tx.type === "EXPENSE"
                            ? <MoneyOff sx={{ fontSize: "1rem" }} />
                            : <CompareArrows sx={{ fontSize: "1rem" }} />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={`${pk}.dark`}
                            >
                              {sign}{tx.amount.toLocaleString("ko-KR")}원
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {dayjs(tx.transactionDate).format("HH:mm")}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {tx.categoryName ?? "미분류"}
                            {tx.description ? ` · ${tx.description}` : ""}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}
