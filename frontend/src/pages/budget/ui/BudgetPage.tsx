import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  Add,
  ChevronLeft,
  ChevronRight,
  ContentCopy,
  Delete,
  Edit,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useBudget } from "../../../entities/budget/model/useBudget";
import BudgetSetModal from "../../../features/budget/ui/BudgetSetModal";
import categoryApi from "../../../entities/category/api/categoryApi";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";
import type { BudgetSummaryResponse } from "../../../entities/budget/api/budget.types";

dayjs.locale("ko");

/** YYYYMM → "2025년 7월" */
function formatYearMonth(ym: string): string {
  return dayjs(ym + "01").format("YYYY년 M월");
}

/** 진행 바 색상 */
function progressColor(ratio: number, isOver: boolean, theme: ReturnType<typeof useTheme>) {
  if (isOver) return theme.palette.error.main;
  if (ratio >= 80) return theme.palette.warning.main;
  return theme.palette.success.main;
}

export default function BudgetPage() {
  const theme = useTheme();
  const {
    yearMonth, setYearMonth,
    summary, loading, error,
    upsertBudget, deleteBudget, copyFromMonth,
    totalBudget, totalActual, totalRatio,
  } = useBudget();

  const [copying, setCopying] = useState(false);

  const prevYearMonth = dayjs(yearMonth + "01").subtract(1, "month").format("YYYYMM");

  const handleCopyFromPrev = async () => {
    if (!window.confirm(`${formatYearMonth(prevYearMonth)}의 예산 설정을 ${formatYearMonth(yearMonth)}에 그대로 적용할까요?\n이미 설정된 예산은 덮어씁니다.`)) return;
    setCopying(true);
    try {
      const count = await copyFromMonth(prevYearMonth);
      if (count === 0) alert(`${formatYearMonth(prevYearMonth)}에 설정된 예산이 없습니다.`);
    } finally {
      setCopying(false);
    }
  };

  const [allCategories, setAllCategories] = useState<CategoryListItemResponse[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BudgetSummaryResponse | null>(null);

  // 전체 카테고리 로드 (예산 추가 시 선택용)
  useEffect(() => {
    categoryApi.getCategories(0, 100)
      .then((res) => setAllCategories(res.categories ?? []))
      .catch(() => { /* 조용히 실패 */ });
  }, []);

  // 예산 미설정 카테고리 (지출 카테고리만)
  const budgetedCatIds = new Set(
    summary.filter((s) => s.hasBudget).map((s) => s.categorySeq).filter(Boolean),
  );
  const availableCategories = allCategories.filter(
    (cat) => cat.type === "EXPENSE" && !budgetedCatIds.has(cat.id),
  );

  const handlePrevMonth = () => setYearMonth(dayjs(yearMonth + "01").subtract(1, "month").format("YYYYMM"));
  const handleNextMonth = () => setYearMonth(dayjs(yearMonth + "01").add(1, "month").format("YYYYMM"));

  const handleOpenAdd = () => { setEditTarget(null); setModalOpen(true); };
  const handleOpenEdit = (item: BudgetSummaryResponse) => { setEditTarget(item); setModalOpen(true); };
  const handleDelete = async (item: BudgetSummaryResponse) => {
    if (!item.budgetId) return;
    if (!window.confirm(`"${item.categoryName}" 예산을 삭제하시겠습니까?`)) return;
    await deleteBudget(item.budgetId);
  };
  const handleSave = async (categorySeq: number, amount: number) => {
    await upsertBudget(categorySeq, amount);
  };

  // 지출 예산 항목 / 수입 포함 기타 항목 분리
  const expenseItems = summary.filter((s) => s.categoryType === "EXPENSE");
  const incomeItems = summary.filter((s) => s.categoryType === "INCOME");

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 6, px: { xs: 2, sm: 3 } }}>

      {/* ── 헤더 ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }}>
            예산 관리
          </Typography>
          <Typography variant="caption" color="text.secondary">{formatYearMonth(yearMonth)}</Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            size="small"
            onClick={() => void handleCopyFromPrev()}
            disabled={copying || loading}
            sx={{
              fontWeight: 600,
              textTransform: "none",
              whiteSpace: "nowrap",
              px: { xs: 1, sm: 1.5 },
              fontSize: { xs: "0.75rem", sm: "0.8rem" },
              display: { xs: "none", sm: "inline-flex" },
            }}
          >
            {copying ? "복사 중..." : "이전 달 복사"}
          </Button>
          {/* 모바일: 아이콘만 */}
          <IconButton
            size="small"
            onClick={() => void handleCopyFromPrev()}
            disabled={copying || loading}
            sx={{ display: { xs: "flex", sm: "none" }, border: "1px solid", borderColor: "divider" }}
            title="이전 달 예산 복사"
          >
            <ContentCopy fontSize="small" />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="small"
            onClick={handleOpenAdd}
            disabled={availableCategories.length === 0 && !loading}
            sx={{ fontWeight: 700, textTransform: "none", whiteSpace: "nowrap",
              px: { xs: 1.5, sm: 2.5 }, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
          >
            예산 추가
          </Button>
        </Stack>
      </Stack>

      {/* ── 월 선택 ── */}
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <IconButton size="small" onClick={handlePrevMonth} sx={{ border: "1px solid", borderColor: "divider" }}>
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={700}>{formatYearMonth(yearMonth)}</Typography>
          <IconButton size="small" onClick={handleNextMonth} sx={{ border: "1px solid", borderColor: "divider" }}>
            <ChevronRight fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>

      {/* ── 총 예산 요약 카드 ── */}
      {!loading && totalBudget > 0 && (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
            <TrendingUp sx={{ color: "primary.main", fontSize: "1.1rem" }} />
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              이번 달 전체 예산
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 3 }} mb={1.5}>
            <Box>
              <Typography variant="caption" color="text.disabled">총 예산</Typography>
              <Typography variant="h6" fontWeight={700}>{totalBudget.toLocaleString("ko-KR")}원</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.disabled">사용</Typography>
              <Typography variant="h6" fontWeight={700}
                color={totalActual > totalBudget ? "error.main" : "text.primary"}>
                {totalActual.toLocaleString("ko-KR")}원
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.disabled">잔여</Typography>
              <Typography variant="h6" fontWeight={700}
                color={totalBudget - totalActual < 0 ? "error.main" : "success.dark"}>
                {(totalBudget - totalActual).toLocaleString("ko-KR")}원
              </Typography>
            </Box>
          </Stack>

          {/* 전체 진행 바 */}
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                {Math.min(totalRatio, 999).toFixed(1)}% 사용
              </Typography>
              {totalActual > totalBudget && (
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Warning sx={{ fontSize: "0.85rem", color: "error.main" }} />
                  <Typography variant="caption" color="error.main" fontWeight={700}>예산 초과</Typography>
                </Stack>
              )}
            </Stack>
            <Box sx={{ height: 8, bgcolor: "action.hover", borderRadius: 99, overflow: "hidden" }}>
              <Box sx={{
                height: "100%",
                width: `${Math.min(totalRatio, 100)}%`,
                bgcolor: totalActual > totalBudget ? "error.main" : totalRatio >= 80 ? "warning.main" : "success.main",
                borderRadius: 99,
                transition: "width 0.4s ease",
              }} />
            </Box>
          </Box>
        </Paper>
      )}

      {/* ── 로딩 ── */}
      {loading && (
        <Stack spacing={2}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={110} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      )}

      {/* ── 에러 ── */}
      {!loading && error && (
        <Paper elevation={0} sx={{ p: 3, textAlign: "center", borderRadius: 2, border: "1px solid", borderColor: alpha(theme.palette.error.main, 0.3) }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* ── 예산 없음 안내 ── */}
      {!loading && !error && summary.length === 0 && (
        <Paper elevation={0} sx={{ p: { xs: 4, sm: 6 }, textAlign: "center", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={700} mb={1}>아직 예산이 없어요</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            카테고리별 예산을 설정하면<br />지출을 계획적으로 관리할 수 있어요.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={() => void handleCopyFromPrev()}
              disabled={copying}
              sx={{ fontWeight: 700, textTransform: "none" }}
            >
              {copying ? "복사 중..." : `${formatYearMonth(prevYearMonth)} 예산 그대로 가져오기`}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenAdd}
              sx={{ fontWeight: 700, textTransform: "none" }}
            >
              직접 추가
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ── 지출 예산 목록 ── */}
      {!loading && expenseItems.length > 0 && (
        <Paper elevation={0} sx={{ mb: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          <Box sx={{ px: { xs: 2, sm: 3 }, py: 1.5, bgcolor: "action.hover" }}>
            <Typography variant="caption" fontWeight={700} color="error.dark"
              sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              지출 예산
            </Typography>
          </Box>
          <Stack divider={<Divider />}>
            {expenseItems.map((item) => (
              <BudgetItem
                key={item.categorySeq ?? `no-budget-${item.categoryName}`}
                item={item}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                theme={theme}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* ── 수입 항목 (예산 미설정 거래 참고용) ── */}
      {!loading && incomeItems.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          <Box sx={{ px: { xs: 2, sm: 3 }, py: 1.5, bgcolor: "action.hover" }}>
            <Typography variant="caption" fontWeight={700} color="success.dark"
              sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              수입 내역
            </Typography>
          </Box>
          <Stack divider={<Divider />}>
            {incomeItems.map((item) => (
              <BudgetItem
                key={item.categorySeq ?? `no-budget-income-${item.categoryName}`}
                item={item}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                theme={theme}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* ── 모달 ── */}
      <BudgetSetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        target={editTarget}
        availableCategories={availableCategories}
        onSave={handleSave}
      />
    </Container>
  );
}

/* ── 개별 예산 항목 컴포넌트 ── */
function BudgetItem({
  item,
  onEdit,
  onDelete,
  theme,
}: {
  item: BudgetSummaryResponse;
  onEdit: (item: BudgetSummaryResponse) => void;
  onDelete: (item: BudgetSummaryResponse) => Promise<void>;
  theme: ReturnType<typeof useTheme>;
}) {
  const isExpense = item.categoryType === "EXPENSE";
  const pct = item.hasBudget ? Math.min(item.ratio, 100) : 0;
  const barColor = item.hasBudget ? progressColor(item.ratio, item.over, theme) : theme.palette.text.disabled;

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.75, sm: 2 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
        {/* 왼쪽: 카테고리 + 금액 */}
        <Stack direction="row" alignItems="center" gap={1} minWidth={0} flex={1}>
          {item.categoryColor && (
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.categoryColor, flexShrink: 0 }} />
          )}
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={600} noWrap>{item.categoryName}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" mt={0.25}>
              <Typography variant="caption" color={isExpense ? "error.dark" : "success.dark"} fontWeight={600}>
                {isExpense ? "-" : "+"}{item.actualAmount.toLocaleString("ko-KR")}원
              </Typography>
              {item.hasBudget && (
                <Typography variant="caption" color="text.disabled">
                  / {item.budgetAmount.toLocaleString("ko-KR")}원
                </Typography>
              )}
              {!item.hasBudget && (
                <Typography variant="caption" color="text.disabled">예산 미설정</Typography>
              )}
            </Stack>
          </Box>
        </Stack>

        {/* 오른쪽: 비율 + 버튼 */}
        <Stack direction="row" alignItems="center" gap={0.5} flexShrink={0} ml={1}>
          {item.hasBudget && (
            <Typography
              variant="caption"
              fontWeight={700}
              color={item.over ? "error.main" : item.ratio >= 80 ? "warning.main" : "success.dark"}
            >
              {item.ratio.toFixed(0)}%
            </Typography>
          )}
          {item.over && <Warning sx={{ fontSize: "0.9rem", color: "error.main" }} />}
          {/* 수정 버튼 (예산 설정 항목만) */}
          {item.hasBudget && (
            <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: "text.secondary" }}>
              <Edit sx={{ fontSize: "0.95rem" }} />
            </IconButton>
          )}
          {/* 삭제 버튼 (예산 설정 항목만) */}
          {item.hasBudget && (
            <IconButton size="small" onClick={() => void onDelete(item)} sx={{ color: "text.secondary" }}>
              <Delete sx={{ fontSize: "0.95rem" }} />
            </IconButton>
          )}
          {/* 예산 미설정 항목 → 추가 버튼 */}
          {!item.hasBudget && isExpense && (
            <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: "primary.main" }}>
              <Add sx={{ fontSize: "0.95rem" }} />
            </IconButton>
          )}
        </Stack>
      </Stack>

      {/* 진행 바 (지출 + 예산 설정 항목만) */}
      {item.hasBudget && isExpense && (
        <Box sx={{ height: 5, bgcolor: "action.hover", borderRadius: 99, overflow: "hidden" }}>
          <Box sx={{
            height: "100%",
            width: `${pct}%`,
            bgcolor: barColor,
            borderRadius: 99,
            transition: "width 0.4s ease",
          }} />
        </Box>
      )}
    </Box>
  );
}
