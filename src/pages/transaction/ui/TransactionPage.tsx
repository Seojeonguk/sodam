import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AddCircle, CalendarMonth, Clear, FileUploadOutlined, FilterList, FormatListBulleted, Search, TuneOutlined } from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { BarChart } from "@mui/x-charts";
import "dayjs/locale/ko";
import dayjs from "dayjs";
import TransactionList from "../../../entities/transaction/ui/TransactionList";
import { useTransactions } from "../../../entities/transaction/model/useTransactions";
import TransactionCreateModal from "../../../features/transaction/ui/TransactionCreateModal";
import TransactionDetailModal from "../../../features/transaction/ui/TransactionDetailModal";
import type { TransactionResponseDto } from "../../../entities/transaction/api/transaction.types";
import TransactionEditModal from "../../../features/transaction/ui/TransactionEditModal";
const TransactionImportModal = lazy(() => import("../../../features/transaction/ui/TransactionImportModal"));
import CalendarView from "./CalendarView";
import categoryApi from "../../../entities/category/api/categoryApi";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";
import { useClassifications } from "../../../entities/category/model/useClassifications";
import { TYPE_LABEL, TYPE_MUI_COLOR } from "../../../entities/category/lib/classificationUtils";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";

dayjs.locale("ko");

type ViewMode = "list" | "calendar";

function TransactionPage() {
  const theme = useTheme();
  const { currentAccountBook } = useAccountBookContext();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransactionSeq, setSelectedTransactionSeq] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<TransactionResponseDto | null>(null);

  const {
    transactions,
    loading,
    error,
    refreshTransactionData,
    deleteTransaction,
    typeStats,
    statPeriodDataset,
    dateRange,
    setDateRange,
    categoryFilter,
    setCategoryFilter,
    keyword,
    setKeyword,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    typeFilter,
    setTypeFilter,
    page,
    setPage,
    totalPages,
    totalElements,
  } = useTransactions({ pageSize: 10 });

  const { classifications } = useClassifications();

  /** 분류별 월별 추이 차트 시리즈 */
  const trendSeries = useMemo(() => {
    const source = classifications.length > 0
      ? classifications
      : [{ name: "INCOME" }, { name: "EXPENSE" }];
    return source.map((cls) => {
      const muiColor = TYPE_MUI_COLOR[cls.name] ?? "default";
      const color = muiColor !== "default"
        ? theme.palette[muiColor as "success" | "error" | "info"].main
        : undefined;
      return {
        dataKey: cls.name.toLowerCase(),
        label: TYPE_LABEL[cls.name] ?? cls.name,
        ...(color ? { color } : {}),
      };
    });
  }, [classifications, theme]);

  // 검색창 로컬 상태 (debounce용)
  const [keywordInput, setKeywordInput] = useState("");
  const [minAmountInput, setMinAmountInput] = useState("");
  const [maxAmountInput, setMaxAmountInput] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [showAmountFilter, setShowAmountFilter] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // keyword debounce (300ms)
  const handleKeywordChange = (val: string) => {
    setKeywordInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setKeyword(val); }, 300);
  };

  const handleAmountApply = () => {
    const min = minAmountInput ? Number(minAmountInput.replace(/,/g, "")) : undefined;
    const max = maxAmountInput ? Number(maxAmountInput.replace(/,/g, "")) : undefined;

    if (
      (min !== undefined && !Number.isSafeInteger(min)) ||
      (max !== undefined && !Number.isSafeInteger(max))
    ) {
      setAmountError("금액이 너무 큽니다. 다시 입력해주세요.");
      return;
    }

    setAmountError(null);
    setMinAmount(min);
    setMaxAmount(max);
  };

  const handleAmountReset = () => {
    setMinAmountInput("");
    setMaxAmountInput("");
    setAmountError(null);
    setMinAmount(undefined);
    setMaxAmount(undefined);
  };

  const handleClearAll = () => {
    setKeywordInput("");
    setKeyword("");
    setMinAmountInput("");
    setMaxAmountInput("");
    setAmountError(null);
    setMinAmount(undefined);
    setMaxAmount(undefined);
    setCategoryFilter([]);
    setTypeFilter("");
  };

  const hasActiveFilter = !!keyword.trim() || minAmount != null || maxAmount != null || categoryFilter.length > 0 || !!typeFilter;

  // 카테고리 목록 (필터 칩 렌더링용)
  const [filterCategories, setFilterCategories] = useState<CategoryListItemResponse[]>([]);
  useEffect(() => {
    if (!currentAccountBook?.id) { setFilterCategories([]); return; }
    categoryApi.getCategories(currentAccountBook.id)
      .then((res) => setFilterCategories(res ?? []))
      .catch(() => { /* 조용히 실패 */ });
  }, [currentAccountBook?.id]);

  const handleOpenCreateModal = () => { setIsCreateModalOpen(true); };
  const handleCloseCreateModal = () => { setIsCreateModalOpen(false); };

  const handleOpenDetailModal = (seq: number) => {
    setSelectedTransactionSeq(seq);
    setIsDetailModalOpen(true);
  };
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTransactionSeq(null);
  };

  const handleOpenEditModal = (transaction: TransactionResponseDto) => {
    setTransactionToEdit(transaction);
    setIsEditModalOpen(true);
    setIsDetailModalOpen(false);
  };
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setTransactionToEdit(null);
  };

  const handleDeleteTransaction = async (seq: number) => {
    if (!window.confirm("정말로 이 거래를 삭제하시겠습니까?")) return;
    try {
      await deleteTransaction(seq);
      handleCloseDetailModal();
    } catch (nextError) {
      alert(nextError instanceof Error ? nextError.message : "거래 삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading && transactions === null) {
    return (
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 6, px: { xs: 2, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Skeleton variant="text" width={120} height={36} />
            <Skeleton variant="text" width={180} height={20} />
          </Box>
          <Skeleton variant="rounded" width={100} height={36} />
        </Stack>
        <Skeleton variant="rounded" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          <Box display="flex" justifyContent="center" gap={2} pb={3}>
            <Skeleton variant="circular" width={120} height={120} />
            <Skeleton variant="circular" width={120} height={120} />
          </Box>
          <Skeleton variant="rounded" width="100%" height={180} sx={{ borderRadius: 1 }} />
        </Paper>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Skeleton variant="circular" width={44} height={44} />
              <Box flex={1}>
                <Skeleton variant="text" width="30%" height={22} />
                <Skeleton variant="text" width="60%" height={18} />
              </Box>
            </Box>
          ))}
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 6, px: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
            border: "1px solid",
            borderColor: alpha(theme.palette.error.main, 0.3),
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>오류가 발생했습니다</Typography>
          <Typography color="text.secondary">{error}</Typography>
          <Button
            onClick={() => { void refreshTransactionData(); }}
            sx={{ mt: 3 }}
            variant="contained"
            color="error"
          >
            다시 시도
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 6, px: { xs: 2, sm: 3 } }}>

      {/* 데이터 갱신 중 표시 */}
      {loading && (
        <LinearProgress
          sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1300, height: 2 }}
        />
      )}

      {/* ── 페이지 헤더: 항상 한 줄 ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5} gap={1}>
        <Box minWidth={0}>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
          >
            거래 내역
          </Typography>
          {viewMode === "list" && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.25 }}
              noWrap
            >
              총 {totalElements}건 · {dateRange.startDate.format("YYYY.MM.DD")} – {dateRange.endDate.format("YYYY.MM.DD")}
            </Typography>
          )}
        </Box>
        <Stack direction="row" alignItems="center" gap={1} flexShrink={0}>
          {/* 뷰 토글 */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v: ViewMode | null) => { if (v) setViewMode(v); }}
            size="small"
            sx={{ "& .MuiToggleButton-root": { px: { xs: 1, sm: 1.5 }, py: 0.5, textTransform: "none", fontWeight: 600 } }}
          >
            <ToggleButton value="list" aria-label="목록 뷰">
              <FormatListBulleted fontSize="small" />
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}>목록</Box>
            </ToggleButton>
            <ToggleButton value="calendar" aria-label="캘린더 뷰">
              <CalendarMonth fontSize="small" />
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}>캘린더</Box>
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="outlined"
            startIcon={<FileUploadOutlined />}
            onClick={() => setIsImportModalOpen(true)}
            size="small"
            sx={{
              fontWeight: 700,
              textTransform: "none",
              whiteSpace: "nowrap",
              px: { xs: 1.2, sm: 2 },
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>엑셀 가져오기</Box>
            <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>가져오기</Box>
          </Button>

          <Button
            variant="contained"
            startIcon={<AddCircle />}
            onClick={handleOpenCreateModal}
            size="small"
            sx={{
              fontWeight: 700,
              textTransform: "none",
              whiteSpace: "nowrap",
              px: { xs: 1.5, sm: 2.5 },
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
            }}
          >
            거래 추가
          </Button>
        </Stack>
      </Stack>

      {/* ── 검색 + 분류 + 카테고리 필터 패널 ── */}
      <Paper
        elevation={0}
        sx={{ p: { xs: 1.5, sm: 2 }, mb: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        {/* 검색바 - 항상 노출 */}
        <TextField
          fullWidth
          size="small"
          placeholder="설명으로 검색..."
          value={keywordInput}
          onChange={(e) => handleKeywordChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: "1.1rem", color: "text.disabled" }} />
                </InputAdornment>
              ),
              endAdornment: keywordInput ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => handleKeywordChange("")} edge="end">
                    <Clear sx={{ fontSize: "1rem" }} />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
          sx={{ mb: 1.5, "& fieldset": { borderRadius: 1.5 } }}
        />

        {/* 분류 탭 */}
        <Stack direction="row" alignItems="center" gap={1} mb={1}>
          <FilterList sx={{ fontSize: "0.9rem", color: "text.secondary", flexShrink: 0 }} />
          <Box display="flex" gap={0.75} flexWrap="wrap">
            {[
              { label: "전체", value: "" },
              ...(classifications.length > 0
                ? classifications.map((c) => ({ label: TYPE_LABEL[c.name] ?? c.name, value: c.name }))
                : [{ label: "수입", value: "INCOME" }, { label: "지출", value: "EXPENSE" }]
              ),
            ].map(({ label, value }) => {
              const isActive = typeFilter === value;
              const muiColor = value ? (TYPE_MUI_COLOR[value] ?? "default") : "default";
              const pk = muiColor !== "default" ? muiColor : "primary";
              const pal = theme.palette[pk as "success" | "error" | "info" | "primary"];
              return (
                <Chip
                  key={value || "all"}
                  label={label}
                  size="small"
                  onClick={() => { setTypeFilter(value); setCategoryFilter([]); }}
                  sx={{
                    fontWeight: isActive ? 700 : 500,
                    bgcolor: isActive ? alpha(pal.main, 0.15) : "action.hover",
                    color: isActive ? pal.dark : "text.secondary",
                    border: "1.5px solid",
                    borderColor: isActive ? alpha(pal.main, 0.5) : "transparent",
                    transition: "all 0.15s ease",
                  }}
                />
              );
            })}
          </Box>
        </Stack>

        {/* 카테고리 칩 (typeFilter 기준으로 그룹핑) */}
        {filterCategories.length > 0 && (() => {
          const visible = typeFilter
            ? filterCategories.filter((c) => c.type === typeFilter)
            : filterCategories;
          if (visible.length === 0) return null;
          const muiColor = typeFilter ? (TYPE_MUI_COLOR[typeFilter] ?? "default") : "default";
          const pk = muiColor !== "default" ? muiColor : "primary";
          const pal = theme.palette[pk as "success" | "error" | "info" | "primary"];
          return (
            <Box
              display="flex"
              gap={0.75}
              flexWrap="wrap"
              sx={{ pt: 0.5, pl: 3 }}
            >
              {visible.map((cat) => {
                const isSelected = categoryFilter.includes(cat.id);
                return (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    size="small"
                    onClick={() =>
                      setCategoryFilter(
                        isSelected
                          ? categoryFilter.filter((id) => id !== cat.id)
                          : [...categoryFilter, cat.id],
                      )
                    }
                    sx={{
                      fontWeight: isSelected ? 700 : 400,
                      fontSize: "0.72rem",
                      bgcolor: isSelected ? alpha(pal.main, 0.12) : "transparent",
                      color: isSelected ? pal.dark : "text.disabled",
                      border: "1px solid",
                      borderColor: isSelected ? alpha(pal.main, 0.4) : "divider",
                      transition: "all 0.15s ease",
                    }}
                  />
                );
              })}
            </Box>
          );
        })()}

        {/* 금액 범위 필터 토글 */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1.5}>
          <Button
            size="small"
            startIcon={<TuneOutlined sx={{ fontSize: "0.95rem" }} />}
            onClick={() => setShowAmountFilter((v) => !v)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.78rem",
              color: (minAmount != null || maxAmount != null) ? "primary.main" : "text.secondary",
              px: 0.5,
            }}
          >
            금액 범위
            {(minAmount != null || maxAmount != null) && (
              <Box component="span" sx={{
                ml: 0.75, px: 0.75, py: 0.1, borderRadius: 99,
                bgcolor: "primary.main", color: "primary.contrastText",
                fontSize: "0.7rem", fontWeight: 700, lineHeight: 1.6,
              }}>
                1
              </Box>
            )}
          </Button>
          {hasActiveFilter && (
            <Button
              size="small"
              onClick={handleClearAll}
              sx={{ textTransform: "none", fontSize: "0.78rem", color: "text.secondary", px: 0.5 }}
            >
              필터 초기화
            </Button>
          )}
        </Stack>

        {/* 금액 범위 입력 */}
        <Collapse in={showAmountFilter}>
          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: "action.hover" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
              <TextField
                label="최소 금액"
                size="small"
                value={minAmountInput}
                onChange={(e) => setMinAmountInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0"
                error={!!amountError}
                inputProps={{ maxLength: 15, inputMode: "numeric" }}
                sx={{ flex: 1, "& fieldset": { borderRadius: 1.5 } }}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">원</InputAdornment> } }}
              />
              <Typography color="text.disabled" fontWeight={700} sx={{ display: { xs: "none", sm: "block" } }}>~</Typography>
              <TextField
                label="최대 금액"
                size="small"
                value={maxAmountInput}
                onChange={(e) => setMaxAmountInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="제한 없음"
                error={!!amountError}
                inputProps={{ maxLength: 15, inputMode: "numeric" }}
                sx={{ flex: 1, "& fieldset": { borderRadius: 1.5 } }}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">원</InputAdornment> } }}
              />
            </Stack>
            {amountError && (
              <Typography color="error" variant="caption" sx={{ display: "block", mt: 0.5 }}>
                {amountError}
              </Typography>
            )}
            <Stack direction="row" spacing={1} mt={1} justifyContent="flex-end">
              <Button size="small" variant="outlined" onClick={handleAmountReset}
                sx={{ textTransform: "none", fontSize: "0.78rem", borderRadius: 1.5 }}>
                초기화
              </Button>
              <Button size="small" variant="contained" onClick={handleAmountApply}
                sx={{ textTransform: "none", fontSize: "0.78rem", borderRadius: 1.5 }}>
                적용
              </Button>
            </Stack>
          </Box>
        </Collapse>

        {/* 활성 필터 요약 칩 */}
        {hasActiveFilter && (
          <Box display="flex" gap={0.75} flexWrap="wrap" mt={1.5} pt={1.5}
            sx={{ borderTop: "1px solid", borderColor: "divider" }}>
            {keyword.trim() && (
              <Chip size="small" label={`"${keyword.trim()}"`}
                onDelete={() => { setKeywordInput(""); setKeyword(""); }}
                sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
            )}
            {typeFilter && (
              <Chip size="small" label={TYPE_LABEL[typeFilter] ?? typeFilter}
                onDelete={() => { setTypeFilter(""); setCategoryFilter([]); }}
                sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
            )}
            {categoryFilter.map((id) => {
              const cat = filterCategories.find((c) => c.id === id);
              return cat ? (
                <Chip key={id} size="small" label={cat.name}
                  onDelete={() => setCategoryFilter(categoryFilter.filter((x) => x !== id))}
                  sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
              ) : null;
            })}
            {(minAmount != null || maxAmount != null) && (
              <Chip size="small"
                label={`${minAmount != null ? minAmount.toLocaleString() + "원" : "0원"} ~ ${maxAmount != null ? maxAmount.toLocaleString() + "원" : "∞"}`}
                onDelete={handleAmountReset}
                sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
            )}
          </Box>
        )}
      </Paper>

      {/* ── 캘린더 뷰 ── */}
      {viewMode === "calendar" && (
        <CalendarView onViewDetail={handleOpenDetailModal} categoryFilter={categoryFilter} />
      )}

      {/* ── 목록 뷰 전용 섹션 ── */}
      {viewMode === "list" && (<>

      {/* ── 날짜 + 추가 필터 ── */}
      <Paper
        elevation={0}
        sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        {/* 날짜 범위 */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 1.5 }}
            alignItems="stretch"
          >
            <DatePicker
              label="시작일"
              value={dateRange.startDate}
              format="YYYY.MM.DD"
              onChange={(newValue) => {
                if (newValue) setDateRange((prev) => ({ ...prev, startDate: newValue }));
              }}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { flex: 1, "& fieldset": { borderRadius: 1.5 } },
                },
              }}
            />
            <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", flexShrink: 0 }}>
              <Typography color="text.disabled" fontWeight={700}>~</Typography>
            </Box>
            <DatePicker
              label="종료일"
              value={dateRange.endDate}
              format="YYYY.MM.DD"
              onChange={(newValue) => {
                if (newValue) setDateRange((prev) => ({ ...prev, endDate: newValue }));
              }}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { flex: 1, "& fieldset": { borderRadius: 1.5 } },
                },
              }}
            />
          </Stack>
        </LocalizationProvider>

      </Paper>

      {/* ── 통계 ── */}
      <Paper
        elevation={0}
        sx={{ p: { xs: 2, sm: 3 }, mb: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        {/* 카테고리 분석: 분류별 동적 렌더링 */}
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", sm: `repeat(${Math.min(trendSeries.length, 2)}, 1fr)` }}
          gap={{ xs: 2.5, sm: 3 }}
          mb={3}
        >
          {trendSeries.map((ser, idx) => {
            const typeName = ser.dataKey.toUpperCase();
            const stats = typeStats[typeName] ?? [];
            const muiColor = TYPE_MUI_COLOR[typeName] ?? "default";
            const pk = muiColor !== "default" ? muiColor : "primary";
            const fallbackColor = muiColor !== "default"
              ? theme.palette[pk as "success" | "error" | "info"].main
              : theme.palette.primary.main;
            return (
              <Box key={typeName}>
                {idx > 0 && <Divider sx={{ display: { xs: "block", sm: "none" }, mb: 2.5 }} />}
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color={`${pk}.dark`}
                  sx={{ display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  {ser.label} 카테고리
                </Typography>
                {stats.length === 0 ? (
                  <Typography variant="body2" color="text.disabled">해당 기간 {ser.label} 없음</Typography>
                ) : (() => {
                  const total = stats.reduce((s, i) => s + (typeof i.value === "number" ? i.value : 0), 0);
                  return (
                    <Stack spacing={1.5}>
                      {stats.map((item) => {
                        const pct = total > 0 ? Math.round(((typeof item.value === "number" ? item.value : 0) / total) * 100) : 0;
                        const barColor = item.color ?? fallbackColor;
                        return (
                          <Box key={item.id}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                              <Stack direction="row" alignItems="center" spacing={0.75}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: barColor, flexShrink: 0 }} />
                                <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 100 }}>
                                  {item.label ?? "기타"}
                                </Typography>
                              </Stack>
                              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                {(typeof item.value === "number" ? item.value : 0).toLocaleString("ko-KR")}원 · {pct}%
                              </Typography>
                            </Stack>
                            <Box sx={{ height: 5, bgcolor: "action.hover", borderRadius: 99, overflow: "hidden" }}>
                              <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: barColor, borderRadius: 99, transition: "width 0.4s ease" }} />
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  );
                })()}
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* 기간별 추이 바차트 */}
        <Box>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            기간별 추이
          </Typography>
          {statPeriodDataset.length === 0 ? (
            <Box sx={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography variant="body2" color="text.disabled">기간 내 거래 내역이 없습니다.</Typography>
            </Box>
          ) : (
            <BarChart
              dataset={statPeriodDataset}
              xAxis={[{ dataKey: "period", scaleType: "band", height: 36 }]}
              series={trendSeries}
              height={200}
              grid={{ horizontal: true }}
            />
          )}
        </Box>
      </Paper>

      {/* ── 거래 목록 ── */}
      <Paper
        elevation={0}
        sx={{ p: { xs: 1.5, sm: 3 }, mb: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Typography variant="h6" component="h2" mb={2} fontWeight={700}>
          거래 목록
        </Typography>
        <TransactionList transactions={transactions} onViewDetail={handleOpenDetailModal} />
      </Paper>

      {/* ── 페이지네이션 ── */}
      {transactions !== null && (
        <Box display="flex" justifyContent="center" mb={4}>
          <Pagination
            count={Math.max(1, totalPages)}
            page={page + 1}
            onChange={(_, value) => {
              setPage(value - 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            color="primary"
            shape="rounded"
            size="medium"
          />
        </Box>
      )}

      </>)}
      {/* ── 목록 뷰 섹션 끝 ── */}

      <Suspense fallback={null}>
        <TransactionImportModal
          open={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => { void refreshTransactionData(); }}
        />
      </Suspense>

      <TransactionCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={refreshTransactionData}
      />
      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        transactionSeq={selectedTransactionSeq}
        onEditRequest={handleOpenEditModal}
        onClose={handleCloseDetailModal}
        onDeleteRequest={(seq) => void handleDeleteTransaction(seq)}
      />
      <TransactionEditModal
        isOpen={isEditModalOpen}
        transactionToEdit={transactionToEdit}
        onClose={handleCloseEditModal}
        onSuccess={refreshTransactionData}
      />
    </Container>
  );
}

export default TransactionPage;
