import { Box, Typography, Button, Container, Paper } from "@mui/material";
import TransactionList from "./components/TransactionList";
import { useTransactions } from "./hooks/useTransactions";
import { AddCircle } from "@mui/icons-material";
import { useState } from "react";
import TransactionCreateModal from "./components/TransactionCreateModal";
import TransactionDetailModal from "./components/TransactionDetailModal";
import type { TransactionResponseDto } from "./services/transaction.types";
import TransactionEditModal from "./components/TransactionEditModal";
import { BarChart, PieChart } from "@mui/x-charts";

function TransactionPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransactionSeq, setSelectedTransactionSeq] = useState<
    number | null
  >(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    useState<TransactionResponseDto | null>(null); // 수정할 거래 객체
  const {
    transactions,
    loading,
    error,
    refetchTransactions,
    deleteTransaction,
    incomeStats,
    expenseStats,
    fetchStats,
    statPeriodDataset,
    fetchPeriodStats,
  } = useTransactions();

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    void refetchTransactions(); // 모달 닫힐 때 목록 갱신
    void fetchStats();
    void fetchPeriodStats();
  };

  const handleOpenDetailModal = (seq: number) => {
    setSelectedTransactionSeq(seq);
    setIsDetailModalOpen(true);
    console.log(seq);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTransactionSeq(null);
  };

  const handleOpenEditModal = (transaction: TransactionResponseDto) => {
    setTransactionToEdit(transaction);
    setIsEditModalOpen(true);
    setIsDetailModalOpen(false); // 상세 모달은 닫기
  };
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setTransactionToEdit(null);
    void refetchTransactions(); // 목록 갱신
    void fetchPeriodStats();
    void fetchStats();
  };

  const handleDeleteTransaction = async (seq: number) => {
    if (window.confirm("정말로 이 거래를 삭제하시겠습니까?")) {
      await deleteTransaction(seq);
      void refetchTransactions(); // 삭제 후 목록 갱신
      void fetchPeriodStats();
      void fetchStats();
      handleCloseDetailModal(); // 상세 모달이 열려있었다면 닫기
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5">거래 내역</Typography>
        <Paper elevation={2} sx={{ p: 3, mt: 2, textAlign: "center" }}>
          <Typography>데이터를 불러오는 중입니다...</Typography>
        </Paper>
      </Container>
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
              void refetchTransactions();
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
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          📊 내 가계부
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircle />}
          onClick={handleOpenCreateModal}
        >
          새 거래 추가
        </Button>
      </Box>

      <Box>
        <Box
          display={"flex"}
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems={"center"}
          justifyContent={"center"}
          gap={10}
          paddingBottom={5}
        >
          <Box>
            <Typography variant="h5" component="h2" mb={2}>
              수입
            </Typography>
            {incomeStats && incomeStats.length > 0 ? (
              <PieChart
                series={[
                  {
                    data: incomeStats,
                  },
                ]}
                width={150}
                height={150}
              />) : (
              <Typography sx={{ width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
                수입 내역이 없습니다.
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="h5" component="h2" mb={2}>
              지출
            </Typography>
            {expenseStats && expenseStats.length > 0 ? (
              <PieChart
                series={[
                  {
                    data: expenseStats,
                  },
                ]}
                width={150}
                height={150}
              />) : (
              <Typography sx={{ width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
                지출 내역이 없습니다.
              </Typography>
            )}
          </Box>
        </Box>

        <Box>
          <Typography>차트</Typography>
          {
            statPeriodDataset.length === 0 ? (
              <Typography sx={{ width: "100%", height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" mb={2}>
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
      />
    </Container>
  );
}

export default TransactionPage;
