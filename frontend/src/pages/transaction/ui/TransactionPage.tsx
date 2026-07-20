import { useState } from "react";
import { AddCircle } from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Container,
  Divider,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { BarChart, PieChart } from "@mui/x-charts";
import "dayjs/locale/ko";
import dayjs from "dayjs";
import TransactionList from "../../../entities/transaction/ui/TransactionList";
import { useTransactions } from "../../../entities/transaction/model/useTransactions";
import TransactionCreateModal from "../../../features/transaction/ui/TransactionCreateModal";
import TransactionDetailModal from "../../../features/transaction/ui/TransactionDetailModal";
import type { TransactionResponseDto } from "../../../entities/transaction/api/transaction.types";
import TransactionEditModal from "../../../features/transaction/ui/TransactionEditModal";

dayjs.locale("ko");

function TransactionPage() {
  const theme = useTheme();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
    incomeStats,
    expenseStats,
    statPeriodDataset,
    dateRange,
    setDateRange,
    page,
    setPage,
    totalPages,
    totalElements,
  } = useTransactions({ pageSize: 10 });

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

  if (loading) {
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
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.25 }}
            noWrap
          >
            총 {totalElements}건 · {dateRange.startDate.format("YYYY.MM.DD")} – {dateRange.endDate.format("YYYY.MM.DD")}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircle />}
          onClick={handleOpenCreateModal}
          size="small"
          sx={{
            fontWeight: 700,
            textTransform: "none",
            flexShrink: 0,
            whiteSpace: "nowrap",
            px: { xs: 1.5, sm: 2.5 },
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
          }}
        >
          거래 추가
        </Button>
      </Stack>

      {/* ── 날짜 필터: 모바일 세로, 데스크톱 가로 ── */}
      <Paper
        elevation={0}
        sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
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
        sx={{ p: { xs: 1.5, sm: 4 }, mb: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        {/* 파이차트: 모바일도 가로 배치 (150px × 2 = 300px, 모바일 충분히 수용) */}
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-around"
          pb={{ xs: 2, sm: 4 }}
        >
          <Box textAlign="center">
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.04em" }}
            >
              수입
            </Typography>
            {incomeStats.length > 0 ? (
              <PieChart
                series={[{ data: incomeStats }]}
                width={140}
                height={140}
              />
            ) : (
              <Box sx={{ width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" color="text.disabled">데이터 없음</Typography>
              </Box>
            )}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.5, sm: 2 } }} />

          <Box textAlign="center">
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.04em" }}
            >
              지출
            </Typography>
            {expenseStats.length > 0 ? (
              <PieChart
                series={[{ data: expenseStats }]}
                width={140}
                height={140}
              />
            ) : (
              <Box sx={{ width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" color="text.disabled">데이터 없음</Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: { xs: 2, sm: 3 } }} />

        {/* 바차트 */}
        <Box>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            기간별 추이
          </Typography>
          {statPeriodDataset.length === 0 ? (
            <Box sx={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography variant="body2" color="text.disabled">기간 내 거래 내역이 없습니다.</Typography>
            </Box>
          ) : (
            <BarChart
              dataset={statPeriodDataset}
              xAxis={[{ dataKey: "period", scaleType: "band", label: "기간", height: 40 }]}
              series={[{ dataKey: "income", label: "수입" }, { dataKey: "expense", label: "지출" }]}
              height={220}
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
