import { useState } from "react";
import { AddCircle } from "@mui/icons-material";
import { Box, Button, Container, Paper, Skeleton, Typography } from "@mui/material";
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransactionSeq, setSelectedTransactionSeq] = useState<
    number | null
  >(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    useState<TransactionResponseDto | null>(null);
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
  } = useTransactions();

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

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
    if (!window.confirm("정말로 이 거래를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteTransaction(seq);
      handleCloseDetailModal();
    } catch (nextError) {
      alert(
        nextError instanceof Error
          ? nextError.message
          : "거래 삭제 중 오류가 발생했습니다.",
      );
    }
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: "#F8FAFC", minHeight: "100vh", pt: 4, pb: 8 }}>
        <Container maxWidth="md">
          <Skeleton variant="text" width="40%" height={48} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="60%" height={40} sx={{ mb: 3 }} />
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, mb: 4, borderRadius: "24px", border: "1px solid #F1F5F9" }}>
            <Box display="flex" justifyContent="center" gap={{ xs: 4, sm: 10 }} flexWrap="wrap">
              <Box textAlign="center">
                <Skeleton variant="circular" width={150} height={150} />
              </Box>
              <Box textAlign="center">
                <Skeleton variant="circular" width={150} height={150} />
              </Box>
            </Box>
          </Paper>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: "24px", border: "1px solid #F1F5F9" }}>
            {[0, 1, 2, 3].map((i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Box flex={1}>
                  <Skeleton variant="text" width="30%" height={24} />
                  <Skeleton variant="text" width="60%" height={20} />
                </Box>
              </Box>
            ))}
          </Paper>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5">거래 내역</Typography>
        <Paper
          elevation={2}
          sx={{ p: 3, mt: 2, textAlign: "center", color: "error.main" }}
        >
          <Typography>오류 발생: {error}</Typography>
          <Button
            onClick={() => {
              void refreshTransactionData();
            }}
            sx={{ mt: 2 }}
            variant="outlined"
          >
            다시 시도
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: "#F8FAFC", minHeight: "100vh", pt: 4, pb: 8 }}>
      <Container maxWidth="md">
        {/* 헤더: 모바일에서 제목+버튼 / 날짜 두 줄 구조 */}
        <Box mb={4}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography
              variant="h4"
              component="h1"
              fontWeight="800"
              color="#334155"
              sx={{ fontSize: { xs: "1.4rem", sm: "1.75rem", md: "2.125rem" } }}
            >
              이번 달 가계부
            </Typography>

            <Button
              variant="contained"
              color="primary"
              startIcon={<AddCircle />}
              onClick={handleOpenCreateModal}
              sx={{
                borderRadius: "24px",
                px: { xs: 2, sm: 3 },
                py: 1,
                textTransform: "none",
                fontWeight: "bold",
                boxShadow: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              거래 추가
            </Button>
          </Box>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
              <DatePicker
                label="시작일"
                value={dateRange.startDate}
                format="YYYY.MM.DD"
                onChange={(newValue) => {
                  if (newValue) {
                    setDateRange((prev) => ({ ...prev, startDate: newValue }));
                  }
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: {
                      flex: 1,
                      minWidth: 0,
                      bgcolor: "white",
                      borderRadius: 2,
                      "& fieldset": { borderRadius: "12px" },
                    },
                  },
                }}
              />
              <Typography color="#94A3B8" fontWeight="bold" sx={{ flexShrink: 0 }}>
                ~
              </Typography>
              <DatePicker
                label="종료일"
                value={dateRange.endDate}
                format="YYYY.MM.DD"
                onChange={(newValue) => {
                  if (newValue) {
                    setDateRange((prev) => ({ ...prev, endDate: newValue }));
                  }
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: {
                      flex: 1,
                      minWidth: 0,
                      bgcolor: "white",
                      borderRadius: 2,
                      "& fieldset": { borderRadius: "12px" },
                    },
                  },
                }}
              />
            </Box>
          </LocalizationProvider>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 4 },
            mb: 4,
            borderRadius: "24px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
            border: "1px solid #F1F5F9",
          }}
        >
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            alignItems="center"
            justifyContent="center"
            gap={{ xs: 4, sm: 10 }}
            paddingBottom={{ xs: 3, sm: 5 }}
          >
            <Box textAlign="center">
              <Typography variant="h6" component="h2" mb={2} fontWeight="bold" color="#64748B">
                월 수입
              </Typography>
              {incomeStats.length > 0 ? (
                <PieChart
                  series={[
                    {
                      data: incomeStats,
                    },
                  ]}
                  width={150}
                  height={150}
                />
              ) : (
                <Typography
                  sx={{
                    width: 150,
                    height: 150,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  수입 내역이 없습니다.
                </Typography>
              )}
            </Box>

            <Box textAlign="center">
              <Typography variant="h6" component="h2" mb={2} fontWeight="bold" color="#64748B">
                월별 지출
              </Typography>
              {expenseStats.length > 0 ? (
                <PieChart
                  series={[
                    {
                      data: expenseStats,
                    },
                  ]}
                  width={150}
                  height={150}
                />
              ) : (
                <Typography
                  sx={{
                    width: 150,
                    height: 150,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  지출 내역이 없습니다.
                </Typography>
              )}
            </Box>
          </Box>

          <Box mt={3}>
            <Typography
              variant="h6"
              component="h2"
              mb={2}
              fontWeight="bold"
              color="#64748B"
              textAlign="center"
            >
              월 기간별 추이
            </Typography>
            {statPeriodDataset.length === 0 ? (
              <Typography
                sx={{
                  width: "100%",
                  height: 320,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                수입 및 지출 내역이 없습니다.
              </Typography>
            ) : (
              <BarChart
                dataset={statPeriodDataset}
                xAxis={[
                  {
                    dataKey: "period",
                    scaleType: "band",
                    label: "기간",
                    height: 50,
                  },
                ]}
                series={[
                  { dataKey: "income", label: "수입" },
                  { dataKey: "expense", label: "지출" },
                ]}
                height={300}
                grid={{ horizontal: true }}
              />
            )}
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 4 },
            mb: 4,
            borderRadius: "24px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
            border: "1px solid #F1F5F9",
            bgcolor: "transparent",
          }}
        >
          <Typography variant="h5" component="h2" mb={3} fontWeight="800" color="#334155">
            최근 거래 내역
          </Typography>
          <TransactionList
            transactions={transactions}
            onViewDetail={handleOpenDetailModal}
          />
        </Paper>

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
    </Box>
  );
}

export default TransactionPage;
