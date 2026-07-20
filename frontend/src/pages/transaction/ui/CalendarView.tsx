import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/ko";
import {
  AttachMoney,
  ChevronLeft,
  ChevronRight,
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
}

export default function CalendarView({ onViewDetail }: CalendarViewProps) {
  const theme = useTheme();
  const { month, setMonth, dayMap, loading } = useCalendarTransactions();
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

  // 월 전체 수입/지출 합계
  let monthIncome = 0;
  let monthExpense = 0;
  for (const d of dayMap.values()) {
    monthIncome += d.income;
    monthExpense += d.expense;
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
                {monthIncome > 0 && (
                  <Box component="span" color="success.dark" fontWeight={600}>
                    +{formatCompactCurrency(monthIncome)}
                  </Box>
                )}
                {monthIncome > 0 && monthExpense > 0 && (
                  <Box component="span" color="text.disabled" mx={0.5}>·</Box>
                )}
                {monthExpense > 0 && (
                  <Box component="span" color="error.dark" fontWeight={600}>
                    -{formatCompactCurrency(monthExpense)}
                  </Box>
                )}
                {monthIncome === 0 && monthExpense === 0 && "거래 없음"}
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
                      {/* 모바일: 컬러 점 */}
                      <Box
                        sx={{
                          display: { xs: "flex", sm: "none" },
                          gap: 0.5,
                          mt: "auto",
                          justifyContent: "center",
                        }}
                      >
                        {data.income > 0 && (
                          <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "success.main" }} />
                        )}
                        {data.expense > 0 && (
                          <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "error.main" }} />
                        )}
                      </Box>

                      {/* 데스크톱: 금액 텍스트 */}
                      <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column", gap: 0.25, mt: "auto" }}>
                        {data.income > 0 && (
                          <Typography
                            sx={{ fontSize: "0.6rem", fontWeight: 700, color: "success.dark", lineHeight: 1.2 }}
                            noWrap
                          >
                            +{formatCompactCurrency(data.income)}
                          </Typography>
                        )}
                        {data.expense > 0 && (
                          <Typography
                            sx={{ fontSize: "0.6rem", fontWeight: 700, color: "error.dark", lineHeight: 1.2 }}
                            noWrap
                          >
                            -{formatCompactCurrency(data.expense)}
                          </Typography>
                        )}
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
                {selectedData.income > 0 && (
                  <Typography variant="caption" fontWeight={700} color="success.dark">
                    +{formatCompactCurrency(selectedData.income)}
                  </Typography>
                )}
                {selectedData.expense > 0 && (
                  <Typography variant="caption" fontWeight={700} color="error.dark">
                    -{formatCompactCurrency(selectedData.expense)}
                  </Typography>
                )}
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
                  const isIncome = tx.type === "INCOME";
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
                            bgcolor: isIncome
                              ? alpha(theme.palette.success.main, 0.12)
                              : alpha(theme.palette.error.main, 0.12),
                            color: isIncome ? theme.palette.success.dark : theme.palette.error.dark,
                          }}
                        >
                          {isIncome
                            ? <AttachMoney sx={{ fontSize: "1rem" }} />
                            : <MoneyOff sx={{ fontSize: "1rem" }} />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={isIncome ? "success.dark" : "error.dark"}
                            >
                              {isIncome ? "+" : "-"}{tx.amount.toLocaleString("ko-KR")}원
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
