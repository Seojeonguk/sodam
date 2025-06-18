import { Box, Typography, Button, Container, Paper } from "@mui/material";

import TransactionList from "./components/TransactionList";
import { useTransactions } from "./hooks/useTransactions";

function TransactionPage() {
  const { transactions, loading, error, refetchTransactions } =
    useTransactions();

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
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" mb={2}>
          최근 거래 내역
        </Typography>
        <TransactionList transactions={transactions} />
      </Paper>
    </Container>
  );
}

export default TransactionPage;
