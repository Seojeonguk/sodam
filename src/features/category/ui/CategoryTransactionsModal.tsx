import { useEffect, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowDownwardRounded,
  ArrowUpwardRounded,
  ChevronLeft,
  ChevronRight,
  Close,
  ReceiptLongOutlined,
} from "@mui/icons-material";
import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";

interface TxRow {
  seq: number;
  amount: number;
  description: string;
  transactionDate: string;
  type: "INCOME" | "EXPENSE";
}

interface Props {
  open: boolean;
  onClose: () => void;
  category: CategoryListItemResponse | null;
  accountBookId: number | undefined;
}

const PAGE_SIZE = 20;

/** YYYYMMDDHHmmss → { date: "MM.DD", year: "YYYY" } */
function fmtDate(s: string) {
  if (s.length < 8) return { date: s, year: "" };
  return {
    date: `${s.slice(4, 6)}.${s.slice(6, 8)}`,
    year: s.slice(0, 4),
  };
}

/** 연속 동일 날짜 헤더를 한 번만 표시하기 위한 날짜 키 */
const dateKey = (s: string) => s.slice(0, 8);

export default function CategoryTransactionsModal({
  open,
  onClose,
  category,
  accountBookId,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [rows, setRows]           = useState<TxRow[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage]           = useState(0);
  const [loading, setLoading]     = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const accent     = category?.color ?? theme.palette.primary.main;
  const isIncome   = category?.type === "INCOME";


  // ── 데이터 로드 ─────────────────────────────────────────────
  useEffect(() => {
    if (!open || !category || !accountBookId) return;
    setPage(0);
    void fetchPage(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category?.id, accountBookId]);

  useEffect(() => {
    if (!open || !category || !accountBookId) return;
    void fetchPage(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchPage = async (p: number) => {
    if (!category || !accountBookId) return;
    setLoading(true);
    try {
      const userSeq = await getUserSeq();

      // 페이지 데이터
      const { data, count, error } = await supabase
        .from("transaction")
        .select("seq, amount, description, transaction_date, type", { count: "exact" })
        .eq("account_book_seq", accountBookId)
        .eq("user_seq", userSeq)
        .eq("category_seq", category.id)
        .order("transaction_date", { ascending: false })
        .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      setRows((data ?? []).map((r: any) => ({
        seq: r.seq as number,
        amount: r.amount as number,
        description: r.description as string,
        transactionDate: r.transaction_date as string,
        type: r.type as "INCOME" | "EXPENSE",
      })));
      setTotal(count ?? 0);

      // 첫 로드 시: 카테고리 전체 합계 계산 (개별 카테고리는 건수가 많지 않음)
      if (p === 0) {
        const { data: allRows, error: sumErr } = await supabase
          .from("transaction")
          .select("amount, type")
          .eq("account_book_seq", accountBookId)
          .eq("user_seq", userSeq)
          .eq("category_seq", category.id);

        if (!sumErr && allRows) {
          const sum = (allRows as { amount: number; type: string }[]).reduce(
            (s, r) => s + (r.type === "INCOME" ? r.amount : -r.amount),
            0,
          );
          setTotalAmount(sum);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        alignItems: { xs: "flex-end", sm: "center" },
        "& .MuiDialog-paper": {
          m: { xs: 0, sm: 2 },
          width: "100%",
          borderRadius: { xs: "20px 20px 0 0", sm: "16px" },
          maxHeight: { xs: "88vh", sm: "82vh" },
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >

      {/* ── 드래그 핸들 (모바일) ── */}
      <Box
        sx={{
          flexShrink: 0,
          display: { sm: "none" },
          pt: 1.2,
          pb: 0.5,
          textAlign: "center",
          background: category?.color
            ? `linear-gradient(135deg, ${alpha(accent, isDark ? 0.35 : 0.18)} 0%, ${alpha(accent, isDark ? 0.15 : 0.06)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.25 : 0.1)} 0%, transparent 100%)`,
        }}
      >
        <Box
          sx={{
            display: "inline-block",
            width: 40,
            height: 4,
            borderRadius: 2,
            bgcolor: alpha(accent, 0.35),
          }}
        />
      </Box>

      {/* ══ 헤더 배너 ══ */}
      <Box
        sx={{
          flexShrink: 0,
          px: 3,
          pt: { xs: 1.5, sm: 3 },
          pb: 2.5,
          background: category?.color
            ? `linear-gradient(135deg, ${alpha(accent, isDark ? 0.35 : 0.18)} 0%, ${alpha(accent, isDark ? 0.15 : 0.06)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.25 : 0.1)} 0%, transparent 100%)`,
          borderBottom: "1px solid",
          borderColor: alpha(accent, 0.2),
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          {/* 카테고리 정보 */}
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1.2}>
              {/* 색상 도트 */}
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: accent,
                  boxShadow: `0 0 0 3px ${alpha(accent, 0.25)}`,
                  flexShrink: 0,
                }}
              />
              <Typography variant="h6" fontWeight={800} lineHeight={1}>
                {category?.name ?? "카테고리"}
              </Typography>
              <Chip
                label={isIncome ? "수입" : "지출"}
                size="small"
                color={isIncome ? "success" : "error"}
                sx={{ fontWeight: 700, fontSize: "0.65rem", height: 20 }}
              />
            </Stack>

            {/* 건수 + 전체 합계 */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                총&nbsp;
                <Typography component="span" fontWeight={800} color="text.primary">
                  {total.toLocaleString()}
                </Typography>
                건
              </Typography>
              {total > 0 && (
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ color: totalAmount >= 0 ? "success.main" : "error.main" }}
                >
                  {totalAmount >= 0 ? "+" : ""}
                  {totalAmount.toLocaleString()}원
                </Typography>
              )}
            </Stack>
          </Stack>

          <IconButton size="small" onClick={onClose} sx={{ mt: -0.5 }}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* ══ 본문 ══ */}
      <DialogContent sx={{ p: 0, flex: 1, overflowY: "auto" }}>

        {/* 스켈레톤 */}
        {loading && (
          <Stack px={2.5} py={1.5} spacing={0}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Box key={i} py={1.2} borderBottom={`1px solid ${alpha(theme.palette.divider, 0.6)}`}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack spacing={0.5}>
                    <Skeleton variant="text" width={160} height={18} />
                    <Skeleton variant="text" width={80} height={14} />
                  </Stack>
                  <Skeleton variant="text" width={72} height={18} />
                </Stack>
              </Box>
            ))}
          </Stack>
        )}

        {/* 빈 상태 */}
        {!loading && rows.length === 0 && (
          <Stack alignItems="center" spacing={1.5} py={8}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.text.disabled, 0.08),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ReceiptLongOutlined sx={{ fontSize: 32, color: "text.disabled" }} />
            </Box>
            <Typography color="text.secondary" variant="body2">
              이 카테고리에 거래 내역이 없습니다.
            </Typography>
          </Stack>
        )}

        {/* 거래 목록 */}
        {!loading && rows.length > 0 && (
          <Box>
            {rows.map((tx, idx) => {
              const { date, year } = fmtDate(tx.transactionDate);
              const prevKey = idx > 0 ? dateKey(rows[idx - 1].transactionDate) : null;
              const showDateHeader = dateKey(tx.transactionDate) !== prevKey;
              const isExp = tx.type === "EXPENSE";

              return (
                <Box key={tx.seq}>
                  {/* 날짜 구분선 */}
                  {showDateHeader && (
                    <Box
                      sx={{
                        px: 2.5,
                        py: 0.8,
                        bgcolor: alpha(theme.palette.background.default, 0.7),
                        borderBottom: "1px solid",
                        borderColor: alpha(theme.palette.divider, 0.5),
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={0.5}>
                        {year}.{date}
                      </Typography>
                    </Box>
                  )}

                  {/* 거래 행 */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    px={2.5}
                    py={1.4}
                    sx={{
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      transition: "background 0.15s",
                      "&:hover": {
                        bgcolor: alpha(accent, 0.05),
                      },
                    }}
                  >
                    {/* 타입 아이콘 */}
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(
                          isExp ? theme.palette.error.main : theme.palette.success.main,
                          0.1,
                        ),
                      }}
                    >
                      {isExp
                        ? <ArrowDownwardRounded sx={{ fontSize: 16, color: "error.main" }} />
                        : <ArrowUpwardRounded   sx={{ fontSize: 16, color: "success.main" }} />}
                    </Box>

                    {/* 설명 */}
                    <Box flex={1} minWidth={0}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        noWrap
                        sx={{ lineHeight: 1.3 }}
                      >
                        {tx.description || "내용 없음"}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {date}
                      </Typography>
                    </Box>

                    {/* 금액 */}
                    <Typography
                      variant="body2"
                      fontWeight={800}
                      sx={{
                        flexShrink: 0,
                        color: isExp ? "error.main" : "success.main",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      {isExp ? "−" : "+"}
                      {tx.amount.toLocaleString()}
                      <Typography component="span" variant="caption" fontWeight={500} ml={0.3}>
                        원
                      </Typography>
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>

      {/* ══ 페이지네이션 ══ */}
      {totalPages > 1 && (
        <Box
          sx={{
            flexShrink: 0,
            px: 2,
            py: 1,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <IconButton
            size="small"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => p - 1)}
            sx={{ borderRadius: 1.5 }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>

          <Stack alignItems="center" spacing={0}>
            <Typography variant="caption" fontWeight={700} color="text.primary">
              {page + 1} / {totalPages}
            </Typography>
            <Typography variant="caption" color="text.disabled" fontSize="0.65rem">
              {(page * PAGE_SIZE + 1).toLocaleString()}–{Math.min((page + 1) * PAGE_SIZE, total).toLocaleString()}번째
            </Typography>
          </Stack>

          <IconButton
            size="small"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
            sx={{ borderRadius: 1.5 }}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* 로딩 오버레이 (페이지 전환 시) */}
      {loading && rows.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.background.paper, 0.55),
            backdropFilter: "blur(2px)",
            zIndex: 10,
          }}
        >
          <CircularProgress size={32} thickness={4} />
        </Box>
      )}
    </Dialog>
  );
}
